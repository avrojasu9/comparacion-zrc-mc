/* Visor ZRC Montaña Caucana · Versión 0.2 · Código completo.
   Datos GeoJSON locales preparados a partir de respaldo ArcGIS Online.
   No constituye una verificación de linderos jurídicos ni de vigencia normativa. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (x,d=0) => Number(x).toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d});
  const norm = x => String(x ?? '').trim().toLocaleLowerCase('es-CO').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const config = [
    {tipo:'original',nombre:'ZRC Polígono original',corto:'Zonificación original'},
    {tipo:'ant2022',nombre:'Polígono ANT 2022',corto:'Polígono ANT 2022'},
    {tipo:'traslapes',nombre:'Traslapes 2025',corto:'Traslapes 2025'},
    {tipo:'ant2025',nombre:'Polígono ANT 2025',corto:'Polígono ANT 2025'},
    {tipo:'cambios',nombre:'Cambios 2022–2025',corto:'Cambios 2022–2025'}
  ];
  const zoneColors={'Alta':'#e17a4a','Centro':'#3c9aaa','Occidente':'#d6ab62','Turmina':'#8f79bf','Media':'#7cbf96','Baja':'#6c8e73','Pedregal':'#c882a0','San Miguel':'#d0ba64','Quebrada de Topa':'#6c9cc5','San Andres':'#b18357'};
  const palette={ant2022:'#d7634c',ant2025:'#31a9a4',forestal:'#a8c96b',solicitudes:'#ac66c2',formalizados:'#cb994b',incorporado:'#238e6a',retirado:'#d05254'};
  const state={data:{},maps:[],mode:'four',syncing:false,selected:null,initBounds:null};
  const DATA=['ant_2022','ant_2025','zonificacion_referencia','municipios','veredas','forestal','solicitudes','formalizados','incorporado_2025','retirado_2025','resumen'];
  const AREA_LABELS={ant2022:'ANT 2022',ant2025:'ANT 2025',original:'Zonificación de referencia',traslapes:'Traslapes y entorno 2025',cambios:'Cambios geométricos 2022–2025'};
  const checked = id => Boolean($(id)?.checked);
  function error(msg){console.error(msg);$('error').textContent=msg;$('error').hidden=false;}
  function baseLayer(){
    const mode=$('base-select').value;
    if(mode==='satelite')return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imágenes © Esri y colaboradores · Condiciones del proveedor'});
    if(mode==='osm')return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'});
    return null;
  }
  function styleFeature(tipo, feature, i){
    const zoom=state.maps[i]?.map?.getZoom() ?? 9;
    const weight=zoom>=13?.3:zoom>=11?.5:.85;
    const props=feature.properties||{};
    const sel=state.selected?.type===tipo && state.selected?.id===(props.id??props.nombre);
    const outline=sel?2.6:weight;
    if(tipo==='original')return {color:sel?'#17352f':'#f8faf5',weight:outline,opacity:sel?1:.9,fillColor:zoneColors[props.zona]||'#7bbaa5',fillOpacity:.64};
    if(tipo==='ant2022')return {color:sel?'#5f2718':'#9c3329',weight:sel?2.5:2,fillColor:palette.ant2022,fillOpacity:.43};
    if(tipo==='ant2025')return {color:sel?'#125d59':'#087d7c',weight:sel?2.5:2.1,fillColor:palette.ant2025,fillOpacity:.42};
    if(tipo==='forestal')return {color:'#568343',weight:sel?2.4:1.0,fillColor:palette.forestal,fillOpacity:.36,dashArray:'4 4'};
    if(tipo==='solicitudes')return {color:'#933ca5',weight:sel?2.4:1.4,fillColor:palette.solicitudes,fillOpacity:.5};
    if(tipo==='formalizados')return {color:'#9b6e30',weight:sel?2.4:1.4,fillColor:palette.formalizados,fillOpacity:.46};
    if(tipo==='incorporado')return {color:'#116b51',weight:sel?2.5:1,fillColor:palette.incorporado,fillOpacity:.75};
    if(tipo==='retirado')return {color:'#a23c43',weight:sel?2.5:1,fillColor:palette.retirado,fillOpacity:.75};
    return {color:'#354d44',weight};
  }
  function entryInfo(tipo,props){
    if(tipo==='original')return {kind:'Zonificación de referencia',title:props.vereda||'Sin nombre',stats:[['Zona',props.zona||'—'],['Área registrada',`${num(props.area_fuente_ha,2)} ha`]],note:`Municipio: ${props.municipio||'Sin dato'}. Geometría proveniente de una copia alternativa de ZRC_MC (83 polígonos); no se ha confirmado que coincida exactamente con el mapa original.`};
    if(tipo==='ant2022')return {kind:'Polígono ANT 2022',title:props.nombre||'Resolución 2022',stats:[['Área fuente',`${num(props.area_fuente_ha,2)} ha`]],note:'Superficie tomada del atributo «area_geome» del respaldo.'};
    if(tipo==='ant2025')return {kind:'Polígono ANT 2025',title:props.nombre||'ANT 2025',stats:[['Área fuente',`${num(props.area_fuente_ha,2)} ha`]],note:'Superficie tomada del atributo «AREA_HAS» del respaldo.'};
    if(['forestal','solicitudes','formalizados'].includes(tipo))return {kind:tipo==='forestal'?'Reserva Forestal · Ley Segunda':tipo==='solicitudes'?'Solicitud indígena':'Resguardo formalizado',title:props.nombre||'Sin nombre',stats:[['Intersección con ANT 2025',props.intersecta_2025?`${num(props.interseccion_2025_ha,2)} ha`:'No identificada']],note:props.intersecta_2025?'Intersección geométrica calculada; no constituye validación jurídica.':'La geometría aparece por cercanía al área de estudio, no porque necesariamente exista traslape.'};
    if(tipo==='incorporado'||tipo==='retirado')return {kind:'Diferencia geométrica 2022–2025',title:tipo==='incorporado'?'Presente en 2025, ausente en 2022':'Presente en 2022, ausente en 2025',stats:[['Superficie calculada',`${num(props.area_calculada_ha,2)} ha`]],note:'Superficie calculada de la diferencia de geometrías originales en una proyección métrica. No equivale al cambio neto de los atributos fuente.'};
    if(tipo==='vereda')return {kind:'Límite veredal',title:props.nombre||'Vereda',stats:[],note:'Geometría auxiliar del respaldo de límites.'};
    return {kind:'Límite municipal',title:props.nombre||'Municipio',stats:[],note:''};
  }
  function detail(info){
    $('selection-type').textContent=info.kind.toUpperCase().slice(0,28);
    let html=`<h3 class="detail-name">${esc(info.title)}</h3><p class="detail-source">${esc(info.kind)}</p>`;
    if(info.stats.length)html+='<div class="detail-stats">'+info.stats.map(([k,v])=>`<div class="detail-stat"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')+'</div>';
    html+=`<p class="detail-info">${esc(info.note)}</p>`;
    $('detail').innerHTML=html;
  }
  function popup(info){
    return `<div class="popup-kind">${esc(info.kind)}</div><div class="popup-name">${esc(info.title)}</div>${info.stats.map(([k,v])=>`<div class="popup-line">${esc(k)}: <strong>${esc(v)}</strong></div>`).join('')}<div class="popup-line">${esc(info.note)}</div>`;
  }
  function makeGeo(P,geoName,tipo,opts={}){
    const data=state.data[geoName];if(!data?.features?.length)return null;
    const isContext=opts.context;
    const layer=L.geoJSON(data,{
      pane:isContext?P.contextPane:P.themePane,
      renderer:L.canvas({pane:isContext?P.contextPane:P.themePane,padding:.5}),
      interactive:!isContext,
      style:f=>isContext ? (tipo==='municipio'?{color:'#233c35',weight:1.2,fillOpacity:0,opacity:.7}:{color:'#e6f2e4',weight:.65,fillOpacity:0,opacity:.75}) : styleFeature(tipo,f,P.index),
      onEachFeature:(f,l)=>{
        if(isContext)return;
        const info=entryInfo(tipo,f.properties);
        l.bindPopup(()=>popup(info),{maxWidth:300,autoPan:true});
        l.bindTooltip(()=>esc(info.title),{sticky:true,direction:'top'});
        l.on('click',evt=>{
          L.DomEvent.stopPropagation(evt);
          state.selected={type:tipo,id:f.properties.id??f.properties.nombre};
          detail(info);
          P.map.closePopup();
          l.openPopup(evt.latlng);
        });
      }
    });
    return layer;
  }
  function renderTheme(P){
    P.theme.clearLayers();
    const t=P.tipo;
    const add=(name,tipo)=>{const l=makeGeo(P,name,tipo);if(l)P.theme.addLayer(l);};
    if(t==='original')add('zonificacion_referencia','original');
    if(t==='ant2022')add('ant_2022','ant2022');
    if(t==='ant2025')add('ant_2025','ant2025');
    if(t==='traslapes'){
      add('ant_2025','ant2025');
      if(checked('layer-forestal'))add('forestal','forestal');
      if(checked('layer-solicitudes'))add('solicitudes','solicitudes');
      if(checked('layer-formalizados'))add('formalizados','formalizados');
      // Contorno de ANT 2025 elevado para mantener visible el ámbito de estudio.
      const outline=L.geoJSON(state.data.ant_2025,{pane:P.topPane,interactive:false,style:{color:'#066b70',weight:2.4,fillOpacity:0,dashArray:'5 4'}});
      P.theme.addLayer(outline);
    }
    if(t==='cambios'){
      const outlines=L.geoJSON(state.data.ant_2022,{pane:P.topPane,interactive:false,style:{color:'#b15c4b',weight:1.5,fillOpacity:0,dashArray:'4 4'}});
      P.theme.addLayer(outlines);
      add('incorporado_2025','incorporado');
      add('retirado_2025','retirado');
    }
    $('map-title-'+P.index).textContent=config.find(x=>x.tipo===t).nombre;
    drawLegend(P);
  }
  function drawLegend(P){
    let items=[],title='',foot='';
    if(P.tipo==='original'){
      title='Zonas de la referencia';items=Object.entries(zoneColors).map(([k,v])=>[k,v]);
      foot='Capa de referencia alternativa; validar equivalencia con el original.';
    }else if(P.tipo==='ant2022'){
      title='ANT 2022';items=[['Polígono de resolución',palette.ant2022]];
      foot='Superficie reportada: '+num(state.data.resumen.area_ant_2022_fuente_ha,2)+' ha';
    }else if(P.tipo==='ant2025'){
      title='ANT 2025';items=[['Polígono ANT 2025',palette.ant2025]];
      foot='Superficie reportada: '+num(state.data.resumen.area_ant_2025_fuente_ha,2)+' ha';
    }else if(P.tipo==='traslapes'){
      title='Territorios y traslapes';items=[['Ámbito ANT 2025',palette.ant2025]];
      if(checked('layer-forestal'))items.push(['Reserva forestal',palette.forestal]);
      if(checked('layer-solicitudes'))items.push(['Solicitudes indígenas',palette.solicitudes]);
      if(checked('layer-formalizados'))items.push(['Resguardos formalizados',palette.formalizados]);
      foot='Algunos polígonos son próximos pero no intersectan ANT 2025.';
    }else{
      title='Diferencias entre polígonos';items=[['Solo en ANT 2025',palette.incorporado],['Solo en ANT 2022',palette.retirado]];
      foot='Superficies aproximadas por diferencia geométrica; no implican actos jurídicos.';
    }
    $('legend-'+P.index).innerHTML=`<details open><summary>${esc(title)}</summary><div class="legend-items">${items.map(([name,color])=>`<div class="legend-item"><i class="legend-swatch" style="background:${color}"></i><span>${esc(name)}</span></div>`).join('')}</div></details><div class="legend-foot">${esc(foot)}</div>`;
  }
  function labelMarkers(){
    const layer=L.layerGroup();
    for(const f of state.data.veredas.features){
      const n=(f.properties.nombre||'').trim();if(!n)continue;
      const center=L.geoJSON(f).getBounds().getCenter();
      const icon=L.divIcon({className:'etiqueta',html:`<span>${esc(n)}</span>`,iconSize:[0,0],iconAnchor:[0,0]});
      L.marker(center,{icon,interactive:false,keyboard:false}).addTo(layer);
    }
    return layer;
  }
  function contextLayers(P){
    P.context.clearLayers();
    if(checked('layer-municipios')){const l=makeGeo(P,'municipios','municipio',{context:true});if(l)P.context.addLayer(l);}
    if(checked('layer-veredas')){const l=makeGeo(P,'veredas','vereda',{context:true});if(l)P.context.addLayer(l);}
    const showLabels=checked('layer-labels')&&P.map.getZoom()>=11;
    if(showLabels&&!P.map.hasLayer(P.labels))P.map.addLayer(P.labels);
    if(!showLabels&&P.map.hasLayer(P.labels))P.map.removeLayer(P.labels);
  }
  function setBasemaps(){
    state.maps.forEach(P=>{
      if(P.base)P.map.removeLayer(P.base);
      P.base=baseLayer();
      if(P.base){P.base.addTo(P.map);P.base.bringToBack();}
    });
  }
  function syncView(index){
    if(state.syncing || state.mode==='one')return;
    const src=state.maps[index].map;
    state.syncing=true;
    for(const P of state.maps){
      if(P.index===index)continue;
      if(P.map.getCenter().distanceTo(src.getCenter())<1 && P.map.getZoom()===src.getZoom())continue;
      P.map.setView(src.getCenter(),src.getZoom(),{animate:false});
    }
    requestAnimationFrame(()=>{state.syncing=false;});
  }
  function prepareMap(i){
    const start=[{tipo:'original'},{tipo:'ant2022'},{tipo:'traslapes'},{tipo:'ant2025'}][i];
    const P={index:i,tipo:start.tipo,base:null,map:null,theme:null,context:null,labels:null};
    const select=$('scenario-'+i);
    for(const opt of config)select.add(new Option(opt.corto,opt.tipo));
    select.value=P.tipo;
    P.map=L.map('map-'+i,{preferCanvas:true,zoomAnimation:false,fadeAnimation:false,zoomControl:false,maxZoom:18});
    L.control.zoom({position:'topleft'}).addTo(P.map);
    P.contextPane=`p${i}context`;P.themePane=`p${i}theme`;P.topPane=`p${i}top`;
    P.map.createPane(P.contextPane);P.map.getPane(P.contextPane).style.zIndex='455';P.map.getPane(P.contextPane).style.pointerEvents='none';
    P.map.createPane(P.themePane);P.map.getPane(P.themePane).style.zIndex='445';
    P.map.createPane(P.topPane);P.map.getPane(P.topPane).style.zIndex='470';P.map.getPane(P.topPane).style.pointerEvents='none';
    P.theme=L.layerGroup().addTo(P.map);P.context=L.layerGroup().addTo(P.map);
    P.map.setView([2.54,-76.16],9);
    P.labels=labelMarkers();
    P.map.on('moveend',()=>syncView(i));
    P.map.on('zoomend',()=>contextLayers(P));
    select.addEventListener('change',()=>{P.tipo=select.value;renderTheme(P);contextLayers(P);});
    state.maps.push(P);
    return P;
  }
  function mode(mode){
    state.mode=mode;
    const single=mode==='one';
    $('maps').classList.toggle('single',single);
    $('mode-four').classList.toggle('active',!single);
    $('mode-one').classList.toggle('active',single);
    $('mode-four').setAttribute('aria-pressed',String(!single));
    $('mode-one').setAttribute('aria-pressed',String(single));
    if(single){
      // La vista de un mapa conserva el contenido elegido en el primer panel.
    }
    setTimeout(()=>{
      state.maps.forEach(P=>P.map.invalidateSize({pan:false}));
      if(!single){
        state.syncing=true;
        const base=state.maps[0].map;
        state.maps.slice(1).forEach(P=>P.map.setView(base.getCenter(),base.getZoom(),{animate:false}));
        requestAnimationFrame(()=>{state.syncing=false;});
      }
    },75);
    setTimeout(()=>state.maps.forEach(P=>P.map.invalidateSize({pan:false})),275);
  }
  function refreshLayers(){state.maps.forEach(P=>{renderTheme(P);contextLayers(P);});}
  function resetView(){if(state.initBounds)state.maps[0].map.fitBounds(state.initBounds,{padding:[25,25],maxZoom:11});}
  function search(){
    const q=norm($('search-text').value),container=$('search-results');container.replaceChildren();
    if(q.length<2){container.hidden=true;return;}
    const found=[];
    for(const f of state.data.zonificacion_referencia.features){
      const p=f.properties;
      if(norm(p.vereda).includes(q)||norm(p.municipio).includes(q))found.push({f,title:p.vereda,subtitle:p.municipio+' · '+p.zona,source:'original'});
    }
    if(found.length<12){
      for(const f of state.data.veredas.features){
        if(norm(f.properties.nombre).includes(q)&&!found.some(r=>norm(r.title)===norm(f.properties.nombre)))found.push({f,title:f.properties.nombre,subtitle:'Límite veredal',source:'vereda'});
        if(found.length>=12)break;
      }
    }
    if(!found.length){const msg=document.createElement('p');msg.className='search-message';msg.textContent='No se encontraron coincidencias.';container.append(msg);}
    found.slice(0,12).forEach(r=>{
      const btn=document.createElement('button');btn.type='button';btn.className='search-item';
      const strong=document.createElement('strong');strong.textContent=r.title||'Sin nombre';
      const small=document.createElement('small');small.textContent=r.subtitle||'';btn.append(strong,small);
      btn.addEventListener('click',()=>{
        const P=state.maps[0];
        if(r.source==='original' && P.tipo!=='original'){$('scenario-0').value='original';P.tipo='original';renderTheme(P);}
        const bounds=L.geoJSON(r.f).getBounds();
        if(bounds.isValid())P.map.fitBounds(bounds,{padding:[30,30],maxZoom:13});
        detail(entryInfo(r.source,r.f.properties));container.hidden=true;
      });container.append(btn);
    });
    container.hidden=false;
  }
  async function init(){
    if(typeof L==='undefined')throw new Error('Leaflet no cargó. Comprueba la conexión a Internet y abre el visor con INICIAR_VISOR.bat.');
    // Los datos vienen incorporados en un archivo JS local. Esto evita el
    // bloqueo CORS de fetch cuando se abre index.html con doble clic (file://).
    // Si en una publicación web no existe el archivo precargado, se conservan
    // las rutas GeoJSON como alternativa mediante HTTP.
    const precargados=window.ZRC_DATOS_INTEGRADOS;
    let datasets;
    if(precargados && DATA.every(nombre=>Object.prototype.hasOwnProperty.call(precargados,nombre))){
      datasets=DATA.map(nombre=>precargados[nombre]);
    }else if(window.location.protocol==='file:'){
      throw new Error('No se pudo leer data/datos_integrados.js. Descomprime completamente el ZIP antes de abrir index.html.');
    }else{
      datasets=await Promise.all(DATA.map(async nombre=>{
        const path=`./data/${nombre}.${nombre==='resumen'?'json':'geojson'}`;
        let respuesta;
        try{respuesta=await fetch(path,{cache:'no-cache'});}
        catch(e){throw new Error(`Error de red al cargar ${path}. Comprueba el servidor local. (${e.message})`);}
        if(!respuesta.ok)throw new Error(`Falta ${path} (HTTP ${respuesta.status})`);
        return respuesta.json();
      }));
    }
    DATA.forEach((key,i)=>state.data[key]=datasets[i]);
    const r=state.data.resumen;
    $('stat-2022').textContent=num(r.area_ant_2022_fuente_ha,2)+' ha';
    $('stat-2025').textContent=num(r.area_ant_2025_fuente_ha,2)+' ha';
    $('stat-cambio').textContent='+'+num(r.cambio_neto_atributos_ha,2)+' ha';
    for(let i=0;i<4;i++)prepareMap(i);
    setBasemaps();
    state.maps.forEach(P=>{renderTheme(P);contextLayers(P);});
    state.initBounds=L.geoJSON(state.data.ant_2022).getBounds().extend(L.geoJSON(state.data.ant_2025).getBounds());
    state.syncing=true;
    state.maps.forEach(P=>{P.map.invalidateSize({pan:false});P.map.fitBounds(state.initBounds,{padding:[25,25],maxZoom:11});});
    requestAnimationFrame(()=>{state.syncing=false;});
    $('base-select').addEventListener('change',setBasemaps);
    ['layer-municipios','layer-veredas','layer-labels','layer-forestal','layer-solicitudes','layer-formalizados'].forEach(id=>$(id).addEventListener('change',refreshLayers));
    $('mode-four').addEventListener('click',()=>mode('four'));
    $('mode-one').addEventListener('click',()=>mode('one'));
    $('reset-view').addEventListener('click',resetView);
    $('search-button').addEventListener('click',search);
    $('search-text').addEventListener('input',()=>{if(!$('search-text').value.trim())$('search-results').hidden=true;});
    $('search-text').addEventListener('keydown',e=>{if(e.key==='Enter')search();});
    if(typeof ResizeObserver!=='undefined'){
      const obs=new ResizeObserver(()=>requestAnimationFrame(()=>state.maps.forEach(P=>P.map.invalidateSize({pan:false}))));
      obs.observe($('maps'));
    }
    window.addEventListener('resize',()=>state.maps.forEach(P=>P.map.invalidateSize({pan:false})));
    console.info('Comparación ZRC MC v0.2 · Capas cargadas:',DATA.map(k=>[k,state.data[k].features?.length ?? 'resumen']));
  }
  document.addEventListener('DOMContentLoaded',()=>init().catch(e=>error(e.message)));
})();
