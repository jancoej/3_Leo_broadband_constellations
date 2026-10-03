const osmProvider = new Cesium.UrlTemplateImageryProvider({
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  maximumLevel: 19,
  credit: "© OpenStreetMap contributors"
});

const viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  timeline: false,
  geocoder: false,
  homeButton: true,
  sceneModePicker: false,
  navigationHelpButton: false,
  fullscreenButton: true,
  baseLayerPicker: false,
  baseLayer: new Cesium.ImageryLayer(osmProvider),
  terrainProvider: new Cesium.EllipsoidTerrainProvider(),
  infoBox: false,
  selectionIndicator: false,
  requestRenderMode: false
});

viewer.scene.backgroundColor = Cesium.Color.BLACK;
viewer.scene.globe.show = true;
viewer.scene.globe.enableLighting = false;
viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b5d88");
viewer.scene.skyAtmosphere.show = true;
viewer.scene.fog.enabled = false;

const constellations = [
  {
    id:"starlink", name:"Starlink", operator:"SpaceX", country:"USA",
    altitudeLabel:"~480 km", altitudeKm:480, frequency:"Ku / Ka",
    latencyLabel:"20–40 ms", latencyMs:30,
    currentLabel:"~10,800", current:10800,
    targetLabel:"~12,000", target:12000,
    longtermLabel:"42,000 (filed)", longterm:42000,
    status:"Commercial", statusClass:"commercial",
    color:"#42d7ff", inclination:53, planes:4, phase:0
  },
  {
    id:"oneweb", name:"Eutelsat OneWeb", operator:"Eutelsat Group", country:"UK / France",
    altitudeLabel:"1,200 km", altitudeKm:1200, frequency:"Ku / Ka",
    latencyLabel:"~50 ms", latencyMs:50,
    currentLabel:"648", current:648,
    targetLabel:"648 + Gen2", target:648,
    longtermLabel:"Gen2 + future expansion", longterm:648,
    status:"Commercial (B2B)", statusClass:"commercial",
    color:"#8be36a", inclination:87, planes:3, phase:40
  },
  {
    id:"amazon", name:"Amazon Leo", operator:"Amazon", country:"USA",
    altitudeLabel:"590–630 km", altitudeKm:610, frequency:"Ka",
    latencyLabel:"~30 ms", latencyMs:30,
    currentLabel:"~330", current:330,
    targetLabel:"~1,600", target:1600,
    longtermLabel:"~7,740", longterm:7740,
    status:"Beta → mid-2026", statusClass:"deploying",
    color:"#ffb347", inclination:51, planes:3, phase:80
  },
  {
    id:"lightspeed", name:"Lightspeed", operator:"Telesat", country:"Canada",
    altitudeLabel:"1,000–1,300 km", altitudeKm:1150, frequency:"Ka",
    latencyLabel:"~50 ms", latencyMs:50,
    currentLabel:"0", current:0,
    targetLabel:"198", target:198,
    longtermLabel:"198", longterm:198,
    status:"Pathfinders Dec 26", statusClass:"planned",
    color:"#bd8cff", inclination:70, planes:2, phase:120
  },
  {
    id:"china", name:"Guowang / Qianfan", operator:"China SatNet / SpaceSail", country:"China",
    altitudeLabel:"~1,160 km (Qianfan)", altitudeKm:1160, frequency:"Ku / Ka",
    latencyLabel:"~50 ms", latencyMs:50,
    currentLabel:"~190 / ~144", current:334,
    targetLabel:"900 / ~1,300", target:2200,
    longtermLabel:"~28,000", longterm:28000,
    status:"Deploying", statusClass:"deploying",
    color:"#ff6978", inclination:66, planes:3, phase:165
  }
];

const state = {
  mode:"current",
  selectedId:"starlink",
  showOrbits:true,
  showSatellites:true,
  showCoverage:true,
  orbitEntities:[],
  satelliteEntities:[],
  coverageEntities:[]
};

function clamp(v,min,max){ return Math.min(Math.max(v,min),max); }
function cssColor(css,alpha=1){ return Cesium.Color.fromCssColorString(css).withAlpha(alpha); }
function selectedConstellation(){ return constellations.find(c=>c.id===state.selectedId); }
function fleetValue(c){ return c[state.mode]; }

function fleetLabel(c){
  if(state.mode==="current") return c.currentLabel;
  if(state.mode==="target") return c.targetLabel;
  return c.longtermLabel;
}

function modeTitle(){
  return state.mode==="current"
    ? "In orbit (2026)"
    : state.mode==="target"
      ? "Target 2027"
      : "Long-term target";
}

function representativeCount(value){
  if(value<=0) return 0;
  return Math.round(clamp(4 + Math.log10(value+1)*5.8,5,32));
}

function altitudeClass(km){
  if(km<700) return "Low LEO";
  if(km<1050) return "Mid LEO";
  return "High LEO";
}

function latencyClass(ms){
  if(ms<=35) return "Low";
  if(ms<=50) return "Moderate";
  return "Higher";
}

function orbitPositions(c,planeIndex){
  const positions=[];
  const phase=c.phase + planeIndex*(360/Math.max(c.planes,1));

  for(let lon=-180;lon<=180;lon+=3){
    const lat=c.inclination*Math.sin(Cesium.Math.toRadians(lon+phase));
    positions.push(
      Cesium.Cartesian3.fromDegrees(lon,lat,c.altitudeKm*1000)
    );
  }
  return positions;
}

function satellitePosition(c,planeIndex,index,total){
  const phase=c.phase + planeIndex*(360/Math.max(c.planes,1));
  const lon=-180 + (index/Math.max(total,1))*360 + planeIndex*13;
  const wrapped=((lon+180)%360+360)%360-180;
  const lat=c.inclination*Math.sin(Cesium.Math.toRadians(wrapped+phase));

  return Cesium.Cartesian3.fromDegrees(
    wrapped,
    lat,
    c.altitudeKm*1000
  );
}

function clearScene(){
  [
    ...state.orbitEntities,
    ...state.satelliteEntities,
    ...state.coverageEntities
  ].forEach(entity=>viewer.entities.remove(entity));

  state.orbitEntities=[];
  state.satelliteEntities=[];
  state.coverageEntities=[];
}

function renderConstellations(){
  clearScene();

  let rendered=0;

  constellations.forEach(c=>{
    const active=c.id===state.selectedId;

    if(state.showOrbits){
      for(let p=0;p<c.planes;p++){
        const orbit=viewer.entities.add({
          name:`${c.name} representative orbit ${p+1}`,
          polyline:{
            positions:orbitPositions(c,p),
            width:active?3.0:1.5,
            material:cssColor(c.color,active?.95:.38),
            arcType:Cesium.ArcType.NONE
          },
          constellationId:c.id
        });
        state.orbitEntities.push(orbit);
      }
    }

    const markers=representativeCount(fleetValue(c));
    rendered += state.showSatellites ? markers : 0;

    if(state.showSatellites && markers>0){
      for(let i=0;i<markers;i++){
        const plane=i%c.planes;
        const indexInPlane=Math.floor(i/c.planes);
        const totalInPlane=Math.ceil(markers/c.planes);

        const sat=viewer.entities.add({
          name:`${c.name} representative satellite ${i+1}`,
          position:satellitePosition(c,plane,indexInPlane,totalInPlane),
          point:{
            pixelSize:active?8:5,
            color:cssColor(c.color,active?1:.72),
            outlineColor:Cesium.Color.BLACK,
            outlineWidth:1,
            disableDepthTestDistance:Number.POSITIVE_INFINITY
          },
          label:{
            text:i===0?c.name:"",
            font:"bold 11px Arial",
            fillColor:cssColor(c.color,1),
            outlineColor:Cesium.Color.BLACK,
            outlineWidth:3,
            style:Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset:new Cesium.Cartesian2(0,-16),
            disableDepthTestDistance:Number.POSITIVE_INFINITY
          },
          constellationId:c.id
        });

        state.satelliteEntities.push(sat);
      }
    }

    if(state.showCoverage){
      const footprintRadius=clamp(
        900000 + c.altitudeKm*900,
        1200000,
        2200000
      );

      const centerLon=((c.phase+180)%360)-180;
      const centerLat=clamp(c.inclination*.16,-25,25);

      const footprint=viewer.entities.add({
        name:`${c.name} nominal coverage footprint`,
        position:Cesium.Cartesian3.fromDegrees(centerLon,centerLat,8000),
        ellipse:{
          semiMajorAxis:footprintRadius,
          semiMinorAxis:footprintRadius,
          material:cssColor(c.color,active?.075:.025),
          outline:true,
          outlineColor:cssColor(c.color,active?.65:.20),
          height:8000
        },
        constellationId:c.id
      });

      state.coverageEntities.push(footprint);
    }
  });

  document.getElementById("renderedSatelliteCount").textContent=rendered;
}

function buildConstellationList(){
  const root=document.getElementById("constellationList");
  root.innerHTML="";

  constellations.forEach(c=>{
    const btn=document.createElement("button");
    btn.className="constellation-card"+(c.id===state.selectedId?" active":"");
    btn.style.setProperty("--accent",c.color);
    btn.innerHTML=`
      <div class="name-row">
        <h3>${c.name}</h3>
        <i class="color-dot"></i>
      </div>
      <small>
        ${c.operator} · ${c.country}<br>
        ${c.altitudeLabel} · ${c.frequency} · ${c.latencyLabel}
      </small>
    `;
    btn.addEventListener("click",()=>selectConstellation(c.id,true));
    root.appendChild(btn);
  });
}

function updateInspector(){
  const c=selectedConstellation();

  document.getElementById("inspectorName").textContent=c.name;

  const status=document.getElementById("inspectorStatus");
  status.textContent=c.status;
  status.className=`status-pill ${c.statusClass}`;

  document.getElementById("operatorValue").textContent=c.operator;
  document.getElementById("countryValue").textContent=c.country;
  document.getElementById("altitudeValue").textContent=c.altitudeLabel;
  document.getElementById("frequencyValue").textContent=c.frequency;
  document.getElementById("latencyValue").textContent=c.latencyLabel;
  document.getElementById("currentFleetValue").textContent=c.currentLabel;
  document.getElementById("targetFleetValue").textContent=c.targetLabel;
  document.getElementById("longTermFleetValue").textContent=c.longtermLabel;

  document.getElementById("visualFleetNumber").textContent=fleetLabel(c);
  document.getElementById("visualMarkerCount").textContent=representativeCount(fleetValue(c));
  document.getElementById("relativeAltitude").textContent=altitudeClass(c.altitudeKm);
  document.getElementById("latencyClass").textContent=latencyClass(c.latencyMs);

  document.getElementById("modeLabel").textContent=modeTitle();
  document.getElementById("selectedConstellationLabel").textContent=c.name;
}

function selectConstellation(id,focus=false){
  state.selectedId=id;
  buildConstellationList();
  updateInspector();
  renderConstellations();
  drawChart();

  if(focus){
    const c=selectedConstellation();

    viewer.camera.flyTo({
      destination:Cesium.Cartesian3.fromDegrees(
        c.phase%180,
        18,
        Math.max(11000000,c.altitudeKm*1000*7.5)
      ),
      orientation:{
        heading:0,
        pitch:Cesium.Math.toRadians(-90),
        roll:0
      },
      duration:1.5
    });
  }
}

function buildSummaryTable(){
  const table=document.getElementById("summaryTable");

  table.innerHTML=`
    <thead>
      <tr>
        <th>Constellation</th>
        <th>Operator</th>
        <th>Country</th>
        <th>Altitude</th>
        <th>Frequency</th>
        <th>Latency</th>
        <th>In orbit (2026)</th>
        <th>Target 2027</th>
        <th>Long-term</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${constellations.map(c=>`
        <tr data-id="${c.id}">
          <td>${c.name}</td>
          <td>${c.operator}</td>
          <td>${c.country}</td>
          <td>${c.altitudeLabel}</td>
          <td>${c.frequency}</td>
          <td>${c.latencyLabel}</td>
          <td>${c.currentLabel}</td>
          <td>${c.targetLabel}</td>
          <td>${c.longtermLabel}</td>
          <td>${c.status}</td>
        </tr>
      `).join("")}
    </tbody>
  `;

  table.querySelectorAll("tbody tr").forEach(row=>{
    row.addEventListener("click",()=>{
      selectConstellation(row.dataset.id,true);
    });
  });
}

function drawChart(){
  const canvas=document.getElementById("comparisonChart");
  const rect=canvas.getBoundingClientRect();

  canvas.width=Math.max(600,Math.floor(rect.width*window.devicePixelRatio));
  canvas.height=Math.max(180,Math.floor(rect.height*window.devicePixelRatio));

  const ctx=canvas.getContext("2d");
  ctx.scale(window.devicePixelRatio,window.devicePixelRatio);

  const w=rect.width;
  const h=rect.height;

  ctx.fillStyle="#061321";
  ctx.fillRect(0,0,w,h);

  const metric=document.getElementById("chartMetric").value;

  let values;
  let chartLabel;
  let maxValue;

  if(metric==="fleet"){
    values=constellations.map(fleetValue);
    chartLabel=modeTitle()+" — spacecraft basis";
    maxValue=Math.max(...values,1);
  }else if(metric==="altitude"){
    values=constellations.map(c=>c.altitudeKm);
    chartLabel="Representative altitude (km)";
    maxValue=Math.max(...values,1);
  }else{
    values=constellations.map(c=>c.latencyMs);
    chartLabel="Representative latency (ms)";
    maxValue=Math.max(...values,1);
  }

  ctx.fillStyle="#8da8bb";
  ctx.font="11px Arial";
  ctx.fillText(chartLabel,14,17);

  const left=125;
  const right=42;
  const top=30;
  const bottom=10;
  const rowGap=(h-top-bottom)/constellations.length;
  const barMax=w-left-right;

  function normalized(v){
    if(metric==="fleet"){
      return Math.log10(v+1)/Math.log10(maxValue+1);
    }
    return v/maxValue;
  }

  constellations.forEach((c,i)=>{
    const y=top+i*rowGap+rowGap*.22;
    const bh=Math.max(8,rowGap*.48);

    ctx.fillStyle="rgba(255,255,255,.06)";
    ctx.fillRect(left,y,barMax,bh);

    ctx.globalAlpha=c.id===state.selectedId?1:.65;
    ctx.fillStyle=c.color;
    ctx.fillRect(left,y,barMax*normalized(values[i]),bh);
    ctx.globalAlpha=1;

    ctx.textAlign="right";
    ctx.fillStyle=c.id===state.selectedId?"#ffffff":"#a9becd";
    ctx.font=(c.id===state.selectedId?"bold ":"")+"10px Arial";
    ctx.fillText(c.name,left-10,y+bh*.72);

    ctx.textAlign="left";
    ctx.fillStyle="#d7e6ef";

    const label=
      metric==="fleet"
        ? fleetLabel(c)
        : metric==="altitude"
          ? `${c.altitudeKm} km`
          : `${c.latencyMs} ms`;

    ctx.fillText(
      label,
      Math.min(left+barMax*normalized(values[i])+7,w-95),
      y+bh*.72
    );
  });
}

function setMode(mode){
  state.mode=mode;

  document.querySelectorAll(".mode-btn").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.mode===mode);
  });

  updateInspector();
  renderConstellations();
  drawChart();
}

function resetEarthView(){
  viewer.resize();

  viewer.camera.flyTo({
    destination:Cesium.Cartesian3.fromDegrees(8,18,22000000),
    orientation:{
      heading:0,
      pitch:Cesium.Math.toRadians(-90),
      roll:0
    },
    duration:1.3
  });
}

document.querySelectorAll(".mode-btn").forEach(btn=>{
  btn.addEventListener("click",()=>setMode(btn.dataset.mode));
});

document.getElementById("showOrbits").addEventListener("change",event=>{
  state.showOrbits=event.target.checked;
  renderConstellations();
});

document.getElementById("showSatellites").addEventListener("change",event=>{
  state.showSatellites=event.target.checked;
  renderConstellations();
});

document.getElementById("showCoverage").addEventListener("change",event=>{
  state.showCoverage=event.target.checked;
  renderConstellations();
});

document.getElementById("resetViewBtn").addEventListener("click",resetEarthView);

document.getElementById("chartMetric").addEventListener("change",drawChart);

const clickHandler=new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

clickHandler.setInputAction(movement=>{
  const picked=viewer.scene.pick(movement.position);

  if(
    Cesium.defined(picked) &&
    picked.id &&
    picked.id.constellationId
  ){
    selectConstellation(picked.id.constellationId,false);
  }
},Cesium.ScreenSpaceEventType.LEFT_CLICK);

buildConstellationList();
buildSummaryTable();
updateInspector();
renderConstellations();

requestAnimationFrame(()=>{
  viewer.resize();
  resetEarthView();
  drawChart();
});

window.addEventListener("resize",()=>{
  viewer.resize();
  drawChart();
});
