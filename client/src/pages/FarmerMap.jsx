import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useResponsive } from '../hooks/useResponsive.js';

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

function ensureLeafletCSS() {
  if (document.getElementById('leaflet-css')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-css'; link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

function markerHTML(farmer, isSelected) {
  const initial = farmer.name?.[0]?.toUpperCase() || 'F';
  const size = isSelected ? 48 : 40;
  const bg   = isSelected ? '#3a7d1e' : '#4e9e2a';
  const shadow = isSelected ? '0 4px 20px rgba(78,158,42,.7)' : '0 2px 10px rgba(78,158,42,.4)';
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:${isSelected?18:15}px;font-weight:700;display:flex;align-items:center;justify-content:center;border:${isSelected?'3px':'2px'} solid #fff;box-shadow:${shadow};cursor:pointer;">${farmer.isVerified ? '✓' : initial}</div>`;
}

/* ── MAP sub-component ──────────────────────────────────────── */
function MapView({ farmers, filtered, search, setSearch, district, setDistrict, zoomToDistrict }) {
  const { isMobile }  = useResponsive();
  const mapRef        = useRef(null);
  const leafletMap    = useRef(null);
  const markersRef    = useRef({});
  const LRef          = useRef(null);
  const [selected,   setSelected]   = useState(null);
  const [listOpen,   setListOpen]   = useState(!isMobile);

  useEffect(() => {
    ensureLeafletCSS();
    if (leafletMap.current || !mapRef.current) return;
    import('leaflet').then(Lmod => {
      const L = Lmod.default || Lmod;
      LRef.current = L;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      leafletMap.current = L.map(mapRef.current, { center: [23.6850, 90.3563], zoom: 7 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18,
      }).addTo(leafletMap.current);
    });
    return () => { leafletMap.current?.remove(); leafletMap.current = null; };
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !LRef.current) return;
    const L = LRef.current;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    // Build a count map to spread overlapping markers at the same coords
    const coordCount = {};
    const coordIndex = {};
    filtered.forEach(farmer => {
      const lat = farmer.location?.lat || DISTRICT_COORDS[farmer.location?.district]?.[0] || 23.8103;
      const lng = farmer.location?.lng || DISTRICT_COORDS[farmer.location?.district]?.[1] || 90.4125;
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      coordCount[key] = (coordCount[key] || 0) + 1;
      coordIndex[key] = 0;
    });
    filtered.forEach(farmer => {
      const baseLat = farmer.location?.lat || DISTRICT_COORDS[farmer.location?.district]?.[0] || 23.8103;
      const baseLng = farmer.location?.lng || DISTRICT_COORDS[farmer.location?.district]?.[1] || 90.4125;
      const key = `${baseLat.toFixed(4)},${baseLng.toFixed(4)}`;
      const total = coordCount[key];
      const idx = coordIndex[key]++;
      // Spread markers in a circle when multiple occupy same spot
      const angle = (2 * Math.PI * idx) / total;
      const radius = total > 1 ? 0.018 : 0; // ~2km spread
      const lat = baseLat + (total > 1 ? radius * Math.cos(angle) : 0);
      const lng = baseLng + (total > 1 ? radius * Math.sin(angle) : 0);
      const icon = L.divIcon({ html: markerHTML(farmer, false), className: '', iconSize: [40,40], iconAnchor: [20,20] });
      const marker = L.marker([lat, lng], { icon }).addTo(leafletMap.current)
        .on('click', () => { setSelected(farmer); if (isMobile) setListOpen(false); });
      marker.bindTooltip(`<b>${farmer.name}</b><br/>${farmer.location?.district || 'Bangladesh'}`,
        { direction: 'top', offset: [0,-24], className: 'krishi-tooltip' });
      markersRef.current[farmer._id] = marker;
    });
    if (!document.getElementById('krishi-map-style')) {
      const s = document.createElement('style'); s.id = 'krishi-map-style';
      // Fix zoom controls: push them below the sticky toggle bar (~50px) + navbar (60px) = 110px total
      s.textContent = `.krishi-tooltip{background:#1a2415;color:#fff;border:none;border-radius:8px;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;padding:6px 10px;box-shadow:0 2px 12px rgba(0,0,0,.2)}.krishi-tooltip::before{display:none}.leaflet-tooltip-top.krishi-tooltip::before{display:block;border-top-color:#1a2415}.leaflet-top.leaflet-left{top:12px!important;left:8px!important}`;
      document.head.appendChild(s);
    }
    // Clear selected if it's no longer in filtered
    setSelected(prev => prev && filtered.find(f => f._id === prev._id) ? prev : null);
  }, [filtered]);

  useEffect(() => {
    if (!LRef.current) return;
    const L = LRef.current;
    filtered.forEach(farmer => {
      const marker = markersRef.current[farmer._id];
      if (!marker) return;
      const isSel = selected?._id === farmer._id;
      marker.setIcon(L.divIcon({ html: markerHTML(farmer, isSel), className: '', iconSize: isSel?[48,48]:[40,40], iconAnchor: isSel?[24,24]:[20,20] }));
    });
    if (selected && leafletMap.current) {
      const lat = selected.location?.lat || DISTRICT_COORDS[selected.location?.district]?.[0] || 23.8103;
      const lng = selected.location?.lng || DISTRICT_COORDS[selected.location?.district]?.[1] || 90.4125;
      leafletMap.current.setView([lat, lng], 10, { animate: true });
    }
  }, [selected, filtered]);

  const handleDistrictZoom = (d) => {
    setDistrict(d);
    if (d !== 'All Districts' && leafletMap.current && DISTRICT_COORDS[d])
      leafletMap.current.setView(DISTRICT_COORDS[d], 10, { animate: true });
    else if (leafletMap.current)
      leafletMap.current.setView([23.6850, 90.3563], 7, { animate: true });
  };

  const SIDEBAR_W = isMobile ? '100%' : '300px';

  return (
    <>
      {/* Mobile search bar — fixed strip below navbar */}
      {isMobile && !listOpen && (
        <div style={{ position:'fixed', top:110, left:0, right:0, zIndex:200, background:'rgba(245,247,242,.97)', borderBottom:'1px solid rgba(60,100,40,.1)', padding:'8px 12px', display:'flex', gap:8, backdropFilter:'blur(8px)', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
          <div style={{ flex:1, position:'relative' }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search farmers, districts…"
              style={{ width:'100%', boxSizing:'border-box', background:'#fff', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:10, padding:'10px 10px 10px 32px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:14, color:'#1a2415', outline:'none' }} />
          </div>
          <button onClick={() => setListOpen(true)} style={{ flexShrink:0, background:'#4e9e2a', border:'none', borderRadius:10, padding:'10px 14px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', whiteSpace:'nowrap' }}>
            🌾 {filtered.length}
          </button>
        </div>
      )}

      {/* Map + sidebar container */}
      <div style={{ position:'fixed', top: isMobile && !listOpen ? 162 : 110, left:0, right:0, bottom:0, display:'flex', overflow:'hidden', transition:'top .2s ease' }}>
        {/* Sidebar */}
        <div style={{ width:SIDEBAR_W, flexShrink:0, display:'flex', flexDirection:'column', background:'#fff', borderRight:'1px solid rgba(60,100,40,.1)', zIndex:10, position:isMobile?'absolute':'relative', top:isMobile?0:'auto', left:isMobile?0:'auto', bottom:isMobile?0:'auto', transform:isMobile && !listOpen?'translateX(-100%)':'translateX(0)', transition:'transform .3s ease', boxShadow:isMobile?'4px 0 20px rgba(0,0,0,.15)':'none' }}>
          <div style={{ padding:'16px 14px 10px', borderBottom:'1px solid rgba(60,100,40,.08)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#1a2415' }}>🗺️ Farmer Map</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, color:'#7a9070' }}>{filtered.length} farmers</span>
                {isMobile && <button onClick={() => setListOpen(false)} style={{ background:'none', border:'none', fontSize:20, color:'#7a9070', cursor:'pointer' }}>✕</button>}
              </div>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search farmers, farms, districts…"
              style={{ width:'100%', boxSizing:'border-box', background:'#f5f7f2', border:'1.5px solid rgba(60,100,40,.12)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#1a2415', outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', marginBottom:8 }} />
            <select value={district} onChange={e => handleDistrictZoom(e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', background:'#f5f7f2', border:'1.5px solid rgba(60,100,40,.12)', borderRadius:9, padding:'9px 12px', fontSize:13, color:'#1a2415', outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', cursor:'pointer' }}>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
            {filtered.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#7a9070' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🌾</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#1a2415' }}>No farmers found</div>
              </div>
            ) : filtered.map(f => {
              const isSel = selected?._id === f._id;
              return (
                <div key={f._id} onClick={() => { setSelected(f); if (isMobile) setListOpen(false); }}
                  style={{ padding:'12px 14px', display:'flex', gap:10, alignItems:'center', cursor:'pointer', borderBottom:'1px solid rgba(60,100,40,.06)', background:isSel?'rgba(78,158,42,.08)':'transparent', borderLeft:`3px solid ${isSel?'#4e9e2a':'transparent'}`, transition:'background .15s' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', flexShrink:0, background:isSel?'#4e9e2a':'rgba(90,176,48,.18)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:isSel?'#fff':'#4e9e2a', fontSize:16, overflow:'hidden' }}>
                    {f.avatar ? <img src={f.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : f.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#1a2415', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                      {f.isVerified && <span style={{ fontSize:10, background:'rgba(29,158,117,.12)', color:'#1d9e75', fontWeight:700, padding:'1px 5px', borderRadius:99, flexShrink:0 }}>✓</span>}
                    </div>
                    {f.farmName && <div style={{ fontSize:11, color:'#4e9e2a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.farmName}</div>}
                    <div style={{ fontSize:11, color:'#7a9070' }}>📍 {f.location?.district || 'Bangladesh'}</div>
                  </div>
                  <span style={{ color:'#c0d0b8', fontSize:16, flexShrink:0 }}>›</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex:1, position:'relative' }}>
          <div ref={mapRef} style={{ width:'100%', height:'100%' }} />
          {selected && (
            <div style={{ position:'absolute', bottom:isMobile?16:24, left:isMobile?12:24, right:isMobile?12:'auto', width:isMobile?'auto':300, background:'#fff', borderRadius:16, padding:16, boxShadow:'0 8px 32px rgba(0,0,0,.18)', zIndex:500, border:'1px solid rgba(60,100,40,.1)', animation:'popIn .2s ease' }}>
              <style>{`@keyframes popIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <button onClick={() => setSelected(null)} style={{ position:'absolute', top:10, right:12, background:'none', border:'none', fontSize:18, color:'#7a9070', cursor:'pointer' }}>✕</button>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(78,158,42,.15)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#4e9e2a', fontSize:20, overflow:'hidden' }}>
                  {selected.avatar ? <img src={selected.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : selected.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:'#1a2415' }}>{selected.name}</span>
                    {selected.isVerified && <span style={{ fontSize:10, background:'rgba(29,158,117,.12)', color:'#1d9e75', fontWeight:700, padding:'2px 7px', borderRadius:99 }}>✓ Verified</span>}
                  </div>
                  {selected.farmName && <div style={{ fontSize:12, color:'#4e9e2a', marginTop:1 }}>{selected.farmName}</div>}
                  <div style={{ fontSize:12, color:'#7a9070', marginTop:2 }}>📍 {selected.location?.district || 'Bangladesh'}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Link to={`/farmer/${selected._id}`} style={{ flex:1, background:'#4e9e2a', color:'#fff', textDecoration:'none', borderRadius:10, padding:'10px', textAlign:'center', fontSize:13, fontWeight:700 }}>View Profile →</Link>
                <Link to={`/farmer/${selected._id}#products`} style={{ flex:1, background:'rgba(78,158,42,.1)', color:'#3a7d1e', textDecoration:'none', borderRadius:10, padding:'10px', textAlign:'center', fontSize:13, fontWeight:700 }}>🛒 Products</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── CARD sub-component ─────────────────────────────────────── */
function CardView({ farmers, filtered, loading, search, setSearch, district, setDistrict, isMobile }) {
  const pad = isMobile ? '16px 14px' : '28px 40px';
  return (
    <div style={{ minHeight:'calc(100vh - 60px)', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif', padding:pad }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:isMobile?22:28, fontWeight:800, color:'#1a2415', marginBottom:4, letterSpacing:'-0.02em' }}>Find Farmers</h1>
        <p style={{ fontSize:13, color:'#7a9070' }}>Browse all verified farmers on KrishiConnect</p>
      </div>

      {/* Search + filter row */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <div style={{ flex:1, minWidth: isMobile ? '100%' : 'auto', position:'relative' }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, farm or district…"
            style={{ width:'100%', boxSizing:'border-box', background:'#fff', border:'1.5px solid rgba(60,100,40,.12)', borderRadius:12, padding:'12px 14px 12px 38px', color:'#1a2415', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }} />
        </div>
        <select value={district} onChange={e => setDistrict(e.target.value)}
          style={{ background:'#fff', border:'1.5px solid rgba(60,100,40,.12)', borderRadius:12, padding:'12px 14px', color:'#1a2415', fontSize:13, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', cursor:'pointer', minWidth:isMobile?'100%':160, boxSizing:'border-box', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ fontSize:13, color:'#7a9070', marginBottom:16 }}>
          {filtered.length} farmer{filtered.length !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div style={{ textAlign:'center', color:'#7a9070', padding:'60px 0', fontSize:14 }}>Loading farmers…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', color:'#7a9070', padding:'60px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🌾</div>
          <div style={{ fontSize:16, fontWeight:600, color:'#1a2415', marginBottom:6 }}>No farmers found</div>
          <div style={{ fontSize:13 }}>Try a different search or district</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(auto-fill,minmax(240px,1fr))', gap:isMobile?12:20 }}>
          {filtered.map(f => (
            <Link key={f._id} to={`/farmer/${f._id}`}
              style={{ background:'#fff', border:'1.5px solid rgba(60,100,40,.1)', borderRadius:16, padding:isMobile?14:20, textDecoration:'none', color:'inherit', display:'block', transition:'box-shadow .2s, transform .2s', boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 24px rgba(78,158,42,.15)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,.05)'; e.currentTarget.style.transform='translateY(0)'; }}>
              {/* Avatar */}
              <div style={{ width:isMobile?46:56, height:isMobile?46:56, borderRadius:'50%', background:'rgba(90,176,48,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile?20:24, fontWeight:800, color:'#4e9e2a', marginBottom:12, overflow:'hidden', border:'2px solid rgba(78,158,42,.1)' }}>
                {f.avatar ? <img src={f.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : f.name?.[0]?.toUpperCase() || 'F'}
              </div>
              {/* Name + verified */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                <div style={{ fontSize:isMobile?13:15, fontWeight:700, color:'#1a2415', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                {f.isVerified && <span style={{ fontSize:10, background:'rgba(29,158,117,.1)', color:'#1d9e75', fontWeight:700, padding:'2px 7px', borderRadius:99, flexShrink:0 }}>✓</span>}
              </div>
              {f.farmName && <div style={{ fontSize:isMobile?11:13, color:'#4e9e2a', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.farmName}</div>}
              <div style={{ fontSize:isMobile?11:12, color:'#7a9070', marginBottom:12 }}>📍 {f.location?.district || 'Bangladesh'}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <span style={{ background:'rgba(90,176,48,.1)', color:'#3a7d1e', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99 }}>View Profile</span>
                {f.isVerified && <span style={{ background:'rgba(29,158,117,.08)', color:'#1d9e75', fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:99 }}>✓ Verified</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── MAIN PAGE ──────────────────────────────────────────────── */
export default function FarmerMap() {
  const { isMobile } = useResponsive();
  const [farmers,  setFarmers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [district, setDistrict] = useState('All Districts');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'map'

  useEffect(() => {
    api.get('/auth/farmers').then(r => {
      const d = r.data;
      const list = Array.isArray(d) ? d : d.farmers || [];
      const coordEntries = Object.entries(DISTRICT_COORDS);
      const inferDistrict = (lat, lng) => {
        if (!lat || !lng) return '';
        let best = '', bestDist = Infinity;
        coordEntries.forEach(([name, [dlat, dlng]]) => {
          const dist = Math.abs(lat - dlat) + Math.abs(lng - dlng);
          if (dist < bestDist) { bestDist = dist; best = name; }
        });
        return bestDist < 1.5 ? best : '';
      };
      setFarmers(list.map(f => {
        const rawDistrict = f.location?.district?.trim() || '';
        return { ...f, location: { ...f.location, district: rawDistrict || inferDistrict(f.location?.lat, f.location?.lng) } };
      }));
    }).catch(() => setFarmers([])).finally(() => setLoading(false));
  }, []);

  const filtered = farmers.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      f.name?.toLowerCase().includes(q) ||
      f.farmName?.toLowerCase().includes(q) ||
      f.location?.district?.toLowerCase().includes(q);
    const matchDistrict = district === 'All Districts' ||
      f.location?.district?.toLowerCase().trim() === district.toLowerCase().trim();
    return matchSearch && matchDistrict;
  });

  const zoomToDistrict = (d) => setDistrict(d);

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── View toggle bar ───────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 60, zIndex: 90,
        background: 'rgba(245,247,242,.97)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(60,100,40,.1)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ fontSize: 13, color: '#7a9070', fontWeight: 600 }}>
          {loading ? 'Loading…' : `${filtered.length} farmer${filtered.length !== 1 ? 's' : ''}`}
        </div>

        {/* Toggle pill */}
        <div style={{ display: 'flex', background: '#eef2ea', borderRadius: 10, padding: 3, gap: 2 }}>
          {[
            { key: 'cards', label: '⊞ Cards' },
            { key: 'map',   label: '🗺️ Map'  },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setViewMode(key)}
              style={{
                background: viewMode === key ? '#4e9e2a' : 'transparent',
                color: viewMode === key ? '#fff' : '#5a7050',
                border: 'none', borderRadius: 8,
                padding: isMobile ? '7px 14px' : '7px 20px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all .15s',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Views ─────────────────────────────────────────────── */}
      {viewMode === 'cards' ? (
        <CardView
          farmers={farmers} filtered={filtered} loading={loading}
          search={search} setSearch={setSearch}
          district={district} setDistrict={setDistrict}
          isMobile={isMobile}
        />
      ) : (
        <MapView
          farmers={farmers} filtered={filtered}
          search={search} setSearch={setSearch}
          district={district} setDistrict={setDistrict}
          zoomToDistrict={zoomToDistrict}
        />
      )}
    </div>
  );
}