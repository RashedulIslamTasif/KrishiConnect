import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useResponsive } from '../hooks/useResponsive.js';

/* ── Bangladesh district centre coords ─────────────────────── */
const DISTRICT_COORDS = {
  'Dhaka':        [23.8103, 90.4125],
  'Chittagong':   [22.3569, 91.7832],
  'Rajshahi':     [24.3745, 88.6042],
  'Khulna':       [22.8456, 89.5403],
  'Sylhet':       [24.8949, 91.8687],
  'Barishal':     [22.7010, 90.3535],
  'Rangpur':      [25.7439, 89.2752],
  'Mymensingh':   [24.7471, 90.4203],
  'Comilla':      [23.4607, 91.1809],
  'Gazipur':      [23.9999, 90.4203],
  'Narayanganj':  [23.6238, 90.5000],
  'Bogura':       [24.8510, 89.3711],
  'Dinajpur':     [25.6279, 88.6338],
  'Jessore':      [23.1664, 89.2182],
  "Cox's Bazar":  [21.4272, 92.0058],
  'Tangail':      [24.2512, 89.9167],
  'Faridpur':     [23.6070, 89.8429],
};

const DISTRICTS = ['All Districts', ...Object.keys(DISTRICT_COORDS)];

/* ── inject Leaflet CSS once ────────────────────────────────── */
function ensureLeafletCSS() {
  if (document.getElementById('leaflet-css')) return;
  const link = document.createElement('link');
  link.id   = 'leaflet-css';
  link.rel  = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

/* ── custom marker HTML ─────────────────────────────────────── */
function markerHTML(farmer, isSelected) {
  const initial = farmer.name?.[0]?.toUpperCase() || 'F';
  const size    = isSelected ? 48 : 40;
  const border  = isSelected ? '3px solid #fff' : '2px solid #fff';
  const bg      = isSelected ? '#3a7d1e' : '#4e9e2a';
  const shadow  = isSelected
    ? '0 4px 20px rgba(78,158,42,.7)'
    : '0 2px 10px rgba(78,158,42,.4)';
  return `
    <div style="
      width:${size}px; height:${size}px; border-radius:50%;
      background:${bg}; color:#fff; font-family:'Plus Jakarta Sans',sans-serif;
      font-size:${isSelected ? 18 : 15}px; font-weight:700;
      display:flex; align-items:center; justify-content:center;
      border:${border}; box-shadow:${shadow};
      cursor:pointer; transition:all .2s;
    ">${farmer.isVerified ? '✓' : initial}</div>
  `;
}

export default function FarmerMap() {
  const { isMobile }  = useResponsive();
  const navigate      = useNavigate();
  const mapRef        = useRef(null);   // DOM node
  const leafletMap    = useRef(null);   // L.Map instance
  const markersRef    = useRef({});     // { id: L.Marker }
  const LRef          = useRef(null);   // Leaflet module

  const [farmers,    setFarmers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [district,   setDistrict]   = useState('All Districts');
  const [selected,   setSelected]   = useState(null);
  const [listOpen,   setListOpen]   = useState(!isMobile);

  /* ── load farmers ─────────────────────────────────────────── */
  useEffect(() => {
    api.get('/auth/farmers')
      .then(r => {
        const d = r.data;
        const list = Array.isArray(d) ? d : d.farmers || [];
        // Trim whitespace from district so filter matches dropdown
        // Build reverse lookup: coords → district name
        const coordEntries = Object.entries(DISTRICT_COORDS);
        const inferDistrict = (lat, lng) => {
          if (!lat || !lng) return '';
          let best = '', bestDist = Infinity;
          coordEntries.forEach(([name, [dlat, dlng]]) => {
            const d = Math.abs(lat - dlat) + Math.abs(lng - dlng);
            if (d < bestDist) { bestDist = d; best = name; }
          });
          return bestDist < 1.5 ? best : '';
        };
        const normalised = list.map(f => {
          const rawDistrict = f.location?.district?.trim() || '';
          const district = rawDistrict ||
            inferDistrict(f.location?.lat, f.location?.lng);
          return { ...f, location: { ...f.location, district } };
        });
        setFarmers(normalised);
      })
      .catch(() => setFarmers([]))
      .finally(() => setLoading(false));
  }, []);

  /* ── init Leaflet map ─────────────────────────────────────── */
  useEffect(() => {
    ensureLeafletCSS();
    if (leafletMap.current || !mapRef.current) return;

    import('leaflet').then(Lmod => {
      const L = Lmod.default || Lmod;
      LRef.current = L;

      // Fix default icon paths (common Vite issue)
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      leafletMap.current = L.map(mapRef.current, {
        center: [23.6850, 90.3563], // Bangladesh center
        zoom:   7,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(leafletMap.current);
    });

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  /* ── add/update markers when farmers load ─────────────────── */
  useEffect(() => {
    if (!leafletMap.current || !LRef.current || farmers.length === 0) return;
    const L = LRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    farmers.forEach(farmer => {
      const lat = farmer.location?.lat  || DISTRICT_COORDS[farmer.location?.district]?.[0] || 23.8103;
      const lng = farmer.location?.lng  || DISTRICT_COORDS[farmer.location?.district]?.[1] || 90.4125;

      const icon = L.divIcon({
        html:      markerHTML(farmer, false),
        className: '',
        iconSize:  [40, 40],
        iconAnchor:[20, 20],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(leafletMap.current)
        .on('click', () => {
          setSelected(farmer);
          if (isMobile) setListOpen(false);
        });

      // Simple tooltip on hover
      marker.bindTooltip(
        `<b>${farmer.name}</b><br/>${farmer.location?.district || 'Bangladesh'}`,
        { direction: 'top', offset: [0, -24], className: 'krishi-tooltip' }
      );

      markersRef.current[farmer._id] = marker;
    });

    // Inject tooltip style
    if (!document.getElementById('krishi-map-style')) {
      const s = document.createElement('style');
      s.id = 'krishi-map-style';
      s.textContent = `
        .krishi-tooltip { background:#1a2415; color:#fff; border:none; border-radius:8px;
          font-family:'Plus Jakarta Sans',sans-serif; font-size:12px; padding:6px 10px;
          box-shadow:0 2px 12px rgba(0,0,0,.2); }
        .krishi-tooltip::before { display:none; }
        .leaflet-tooltip-top.krishi-tooltip::before { display:block; border-top-color:#1a2415; }
        /* Push zoom controls below the mobile search bar */
        @media (max-width: 639px) {
          .leaflet-top.leaflet-left { top: 64px !important; left: 8px !important; }
        }
      `;
      document.head.appendChild(s);
    }
  }, [farmers]);

  /* ── update marker icons when selection changes ────────────── */
  useEffect(() => {
    if (!LRef.current) return;
    const L = LRef.current;
    farmers.forEach(farmer => {
      const marker = markersRef.current[farmer._id];
      if (!marker) return;
      const isSel = selected?._id === farmer._id;
      marker.setIcon(L.divIcon({
        html:      markerHTML(farmer, isSel),
        className: '',
        iconSize:  isSel ? [48, 48] : [40, 40],
        iconAnchor:isSel ? [24, 24] : [20, 20],
      }));
    });

    // Pan to selected farmer
    if (selected && leafletMap.current) {
      const lat = selected.location?.lat  || DISTRICT_COORDS[selected.location?.district]?.[0] || 23.8103;
      const lng = selected.location?.lng  || DISTRICT_COORDS[selected.location?.district]?.[1] || 90.4125;
      leafletMap.current.setView([lat, lng], 10, { animate: true });
    }
  }, [selected, farmers]);

  /* ── filtered list ────────────────────────────────────────── */
  const filtered = farmers.filter(f => {
    const q = search.toLowerCase();
    const matchSearch =
      f.name?.toLowerCase().includes(q) ||
      f.farmName?.toLowerCase().includes(q) ||
      f.location?.district?.toLowerCase().includes(q);
    const matchDistrict =
      district === 'All Districts' ||
      f.location?.district?.toLowerCase().trim() === district.toLowerCase().trim();
    return matchSearch && matchDistrict;
  });

  /* ── zoom to district ────────────────────────────────────── */
  const zoomToDistrict = (d) => {
    setDistrict(d);
    if (d !== 'All Districts' && leafletMap.current && DISTRICT_COORDS[d]) {
      leafletMap.current.setView(DISTRICT_COORDS[d], 10, { animate: true });
    } else if (leafletMap.current) {
      leafletMap.current.setView([23.6850, 90.3563], 7, { animate: true });
    }
  };

  /* ── styles ───────────────────────────────────────────────── */
  const SIDEBAR_W = isMobile ? '100%' : '320px';

  return (
    <div style={{
      position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
      display: 'flex', fontFamily: 'Plus Jakarta Sans, sans-serif',
      background: '#f5f7f2', overflow: 'hidden',
    }}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <div style={{
        width: SIDEBAR_W,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRight: '1px solid rgba(60,100,40,.1)',
        zIndex: 10,
        position: isMobile ? 'absolute' : 'relative',
        top: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        bottom: isMobile ? 0 : 'auto',
        transform: isMobile && !listOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform .3s ease',
        boxShadow: isMobile ? '4px 0 20px rgba(0,0,0,.15)' : 'none',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid rgba(60,100,40,.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1a2415' }}>🗺️ Farmer Map</div>
              <div style={{ fontSize: 12, color: '#7a9070', marginTop: 2 }}>
                {loading ? 'Loading…' : `${filtered.length} farmers found`}
              </div>
            </div>
            {isMobile && (
              <button onClick={() => setListOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: '#7a9070', cursor: 'pointer' }}>✕</button>
            )}
          </div>

          {/* Search */}
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search farmers, farms, districts…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#f5f7f2', border: '1.5px solid rgba(60,100,40,.12)',
              borderRadius: 10, padding: '10px 14px', color: '#1a2415',
              fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 10,
            }}
          />

          {/* District filter */}
          <select value={district} onChange={e => zoomToDistrict(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#f5f7f2', border: '1.5px solid rgba(60,100,40,.12)',
              borderRadius: 10, padding: '10px 14px', color: '#1a2415',
              fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
            }}>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Farmer list */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#7a9070', fontSize: 13 }}>Loading farmers…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#7a9070' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🌾</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2415' }}>No farmers found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search or district</div>
            </div>
          ) : filtered.map(f => {
            const isSel = selected?._id === f._id;
            return (
              <div key={f._id}
                onClick={() => { setSelected(f); if (isMobile) setListOpen(false); }}
                style={{
                  padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center',
                  cursor: 'pointer', borderBottom: '1px solid rgba(60,100,40,.06)',
                  background: isSel ? 'rgba(78,158,42,.08)' : 'transparent',
                  borderLeft: `3px solid ${isSel ? '#4e9e2a' : 'transparent'}`,
                  transition: 'background .15s',
                }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: isSel ? '#4e9e2a' : 'rgba(90,176,48,.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: isSel ? '#fff' : '#4e9e2a', fontSize: 18,
                  overflow: 'hidden',
                }}>
                  {f.avatar
                    ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : f.name?.[0]?.toUpperCase()}
                </div>
                {/* Info */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2415', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    {f.isVerified && <span style={{ fontSize: 10, background: 'rgba(29,158,117,.12)', color: '#1d9e75', fontWeight: 700, padding: '1px 6px', borderRadius: 99, flexShrink: 0 }}>✓</span>}
                  </div>
                  {f.farmName && <div style={{ fontSize: 12, color: '#4e9e2a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.farmName}</div>}
                  <div style={{ fontSize: 11, color: '#7a9070' }}>📍 {f.location?.district || 'Bangladesh'}</div>
                </div>
                <span style={{ color: '#c0d0b8', fontSize: 18, flexShrink: 0 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAP AREA ──────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Map container */}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Mobile: search bar at top-right (avoids zoom controls at top-left) */}
        {isMobile && !listOpen && (
          <div style={{
            position: 'absolute', top: 12, left: 60, right: 12, zIndex: 500,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            {/* Search input */}
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search farmers…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#fff', border: '1.5px solid rgba(60,100,40,.15)',
                  borderRadius: 10, padding: '10px 10px 10px 30px',
                  fontFamily: 'inherit', fontSize: 13, color: '#1a2415',
                  outline: 'none', boxShadow: '0 2px 12px rgba(0,0,0,.14)',
                }}
              />
            </div>
            {/* Open list button */}
            <button onClick={() => setListOpen(true)}
              style={{
                flexShrink: 0,
                background: '#4e9e2a', border: 'none',
                borderRadius: 10, padding: '10px 12px',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                color: '#fff', cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(78,158,42,.4)',
                display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
              }}>
              🌾 {loading ? '…' : filtered.length}
            </button>
          </div>
        )}

        {/* Selected farmer popup card */}
        {selected && (
          <div style={{
            position: 'absolute',
            bottom: isMobile ? 20 : 24,
            left: isMobile ? 12 : 24,
            right: isMobile ? 12 : 'auto',
            width: isMobile ? 'auto' : 300,
            background: '#fff',
            borderRadius: 16,
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,.18)',
            zIndex: 500,
            border: '1px solid rgba(60,100,40,.1)',
            animation: 'popIn .2s ease',
          }}>
            <style>{`@keyframes popIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <button onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', fontSize: 18, color: '#7a9070', cursor: 'pointer' }}>✕</button>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: 'rgba(78,158,42,.15)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: '#4e9e2a', fontSize: 20, overflow: 'hidden',
              }}>
                {selected.avatar
                  ? <img src={selected.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : selected.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1a2415' }}>{selected.name}</span>
                  {selected.isVerified && <span style={{ fontSize: 10, background: 'rgba(29,158,117,.12)', color: '#1d9e75', fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>✓ Verified</span>}
                </div>
                {selected.farmName && <div style={{ fontSize: 12, color: '#4e9e2a', marginTop: 1 }}>{selected.farmName}</div>}
                <div style={{ fontSize: 12, color: '#7a9070', marginTop: 2 }}>📍 {selected.location?.district || 'Bangladesh'}</div>
              </div>
            </div>

            {selected.bio && (
              <div style={{ fontSize: 12, color: '#5a7050', marginBottom: 12, lineHeight: 1.5,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {selected.bio}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/farmer/${selected._id}`}
                style={{
                  flex: 1, background: '#4e9e2a', color: '#fff', textDecoration: 'none',
                  borderRadius: 10, padding: '10px', textAlign: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>
                View Profile →
              </Link>
              <Link to={`/farmer/${selected._id}#products`}
                style={{
                  flex: 1, background: 'rgba(78,158,42,.1)', color: '#3a7d1e', textDecoration: 'none',
                  borderRadius: 10, padding: '10px', textAlign: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>
                🛒 Products
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}