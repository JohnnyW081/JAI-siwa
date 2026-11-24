export const stageVertex = /* glsl */`
  varying vec2 screenUV;
  void main() {
    screenUV = uv;
    gl_Position = vec4(position.xy, .999, 1.);
  }
`;

export const stageFragment = /* glsl */`
  uniform vec3 upper;
  uniform vec3 lower;
  uniform float kind;
  uniform float time;
  uniform float aspect;
  varying vec2 screenUV;

  float rand(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float border(vec2 p) {
    vec2 f = abs(fract(p) - .5);
    return smoothstep(.476, .496, max(f.x, f.y));
  }
  float box(vec2 p, vec2 center, vec2 size, float blur) {
    vec2 d = abs(p - center) - size;
    return 1. - smoothstep(0., blur, max(d.x, d.y));
  }
  float disc(vec2 p, vec2 center, vec2 size, float blur) {
    return 1. - smoothstep(1. - blur, 1., length((p - center) / size));
  }
  float tileFloor(vec2 p, float offset) {
    float z = 1. / max(.10, p.y - .40);
    vec2 tiles = vec2(((p.x-.43) * 4.7 + .86) * z, ((p.x-.43) * -2.8 + 3.8) * z);
    vec2 distanceToGrout = .5 - abs(fract(tiles + offset) - .5);
    vec2 antialias = max(fwidth(tiles) * .9, vec2(.004));
    vec2 lines = 1. - smoothstep(vec2(.010), vec2(.019)+antialias, distanceToGrout);
    return max(lines.x,lines.y);
  }
  vec3 study(vec2 p) {
    // warm wood wall (top) / wood floor (bottom)
    vec3 rgb = mix(vec3(.330,.235,.158),vec3(.214,.150,.102),smoothstep(.04,1.,p.y));
    float floorY = .612 + .075*abs(p.x - .44);
    float grain = .5 + .5*sin(p.y*760. + sin(p.x*29.)*2.2);
    vec3 wood = mix(vec3(.452,.302,.188),vec3(.360,.232,.142),grain);
    wood -= .05*tileFloor(p,.5);
    rgb = mix(rgb,wood,smoothstep(-.012,.012,p.y-floorY));
    // bookshelf (left): dark frame + two dividers + books
    float sL=.075, sR=.548, sT=.050, sB=.478;
    float scx=(sL+sR)*.5, scy=(sT+sB)*.5;
    rgb = mix(rgb,vec3(.146,.098,.066),box(p,vec2(scx,scy),vec2((sR-sL)*.5,(sB-sT)*.5),.006)*.94);
    rgb = mix(rgb,vec3(.20,.14,.09),box(p,vec2(scx,.306),vec2((sR-sL)*.5,.006),.004));
    rgb = mix(rgb,vec3(.20,.14,.09),box(p,vec2(scx,.172),vec2((sR-sL)*.5,.006),.004));
    vec3 bk1=vec3(.42,.30,.22); vec3 bk2=vec3(.30,.36,.42); vec3 bk3=vec3(.48,.42,.30); vec3 bk4=vec3(.36,.26,.30);
    rgb = mix(rgb,bk1,box(p,vec2(.14,.243),vec2(.030,.060),.010)*.9);
    rgb = mix(rgb,bk2,box(p,vec2(.19,.246),vec2(.026,.057),.010)*.9);
    rgb = mix(rgb,bk3,box(p,vec2(.24,.242),vec2(.034,.063),.010)*.9);
    rgb = mix(rgb,bk4,box(p,vec2(.31,.245),vec2(.028,.058),.010)*.9);
    rgb = mix(rgb,bk2,box(p,vec2(.40,.140),vec2(.032,.058),.010)*.9);
    rgb = mix(rgb,bk1,box(p,vec2(.46,.142),vec2(.026,.056),.010)*.9);
    // desk (lower right)
    vec3 deskWood = mix(vec3(.360,.232,.142),vec3(.452,.302,.188),grain);
    rgb = mix(rgb,deskWood,box(p,vec2(.700,.545),vec2(.248,.012),.006)*.97);
    rgb = mix(rgb,deskWood*.82,box(p,vec2(.474,.494),vec2(.010,.050),.004)*.92);
    rgb = mix(rgb,deskWood*.82,box(p,vec2(.926,.494),vec2(.010,.050),.004)*.92);
    // desk lamp: warm glow + shade + stem + base
    float lamp = disc(p,vec2(.612,.516),vec2(.112,.126),.95);
    rgb += vec3(.440,.300,.136)*lamp*lamp*.86;
    vec3 shadeCol=vec3(.870,.712,.418); vec3 stemCol=vec3(.322,.266,.198);
    rgb = mix(rgb,shadeCol,box(p,vec2(.612,.530),vec2(.050,.004),.003)*.94);
    rgb = mix(rgb,shadeCol,box(p,vec2(.577,.522),vec2(.0030,.015),.004));
    rgb = mix(rgb,shadeCol,box(p,vec2(.647,.522),vec2(.0030,.015),.004));
    rgb = mix(rgb,stemCol,box(p,vec2(.632,.494),vec2(.0032,.016),.003)*.92);
    rgb = mix(rgb,stemCol*.95,disc(p,vec2(.632,.474),vec2(.026,.0062),.5)*.92);
    // book stack on desk
    rgb = mix(rgb,bk4,box(p,vec2(.545,.556),vec2(.05,.006),.003)*.9);
    rgb = mix(rgb,bk2,box(p,vec2(.545,.563),vec2(.045,.006),.003)*.9);
    return rgb;
  }

  vec3 reflectLight(vec2 p, vec2 center, float radius, vec3 glow, float seed) {
    vec2 ratio = vec2(radius,radius*1.6);
    float halo = disc(p,center,ratio,.32);
    float highlight = disc(p,center,ratio*.82,.15);
    float y = p.y - (.57 + rand(vec2(seed,2.))*.19);
    float wavering = sin(p.y*170. + time*2.2)*.007 + sin(p.y*425.-time*3.2)*.004;
    float x = abs(p.x - center.x - y*.16 - wavering);
    float reflection = (1.-smoothstep(radius*.45,radius*1.42,x)) * smoothstep(-.02,.045,y);
    reflection *= (.26 + .42 * (.5+.5*sin(p.y * 75. + time*.4))) * (1.-smoothstep(.25,.51,y));
    return glow*(halo*.67+highlight*.17+reflection);
  }
  vec3 bedroom(vec2 p) {
    // dim night wall (deep blue-purple)
    vec3 rgb = mix(vec3(.20,.17,.26),vec3(.14,.12,.18),smoothstep(.1,1.,p.y));
    // carpet (lower)
    float floorY = .62 + .06*abs(p.x-.5);
    vec3 carpet = vec3(.24,.20,.18)*(0.94+0.06*sin(p.x*90.)*sin(p.y*90.));
    rgb = mix(rgb,carpet,smoothstep(-.012,.012,p.y-floorY));
    // headboard (dark brown)
    rgb = mix(rgb,vec3(.30,.20,.14),box(p,vec2(.40,.33),vec2(.26,.10),.02)*.9);
    // bed sheet + two pillows
    rgb = mix(rgb,vec3(.48,.46,.52),box(p,vec2(.40,.455),vec2(.28,.09),.02)*.85);
    rgb = mix(rgb,vec3(.72,.70,.74),box(p,vec2(.26,.382),vec2(.09,.05),.04)*.9);
    rgb = mix(rgb,vec3(.72,.70,.74),box(p,vec2(.52,.382),vec2(.09,.05),.04)*.9);
    // right curtain (folds)
    rgb = mix(rgb,vec3(.30,.26,.36),step(.70,p.x)*step(p.x,.94)*step(.05,p.y)*step(p.y,.60)*(.86+.10*sin(p.x*40.))*.85);
    // bedside night light (warm orange glow)
    rgb += reflectLight(p,vec2(.70,.40),.05,vec3(.60,.35,.15),3.)*.6;
    return rgb;
  }

  vec3 office(vec2 p) {
    // cool grey wall
    vec3 rgb = mix(vec3(.66,.68,.72),vec3(.55,.58,.63),smoothstep(.05,1.,p.y));
    // cool grey tile floor
    float floorY = .60 + .05*abs(p.x-.5);
    rgb = mix(rgb,vec3(.72,.73,.71)-.04*tileFloor(p,.3),smoothstep(-.012,.012,p.y-floorY));
    // floor-to-ceiling window (mid-top): cold white / pale blue sky
    float wL=.18, wR=.82, wT=.08, wB=.52;
    float wcx=(wL+wR)*.5, wcy=(wT+wB)*.5, wu=(wR-wL)*.5, wv=(wB-wT)*.5;
    vec3 sky = mix(vec3(.82,.88,.94),vec3(.70,.80,.92),smoothstep(wT,wB,p.y));
    sky += .045*sin(p.x*30.+p.y*12.)*sin(p.x*17.-p.y*7.);
    rgb = mix(rgb,sky,box(p,vec2(wcx,wcy),vec2(wu,wv),.004)*.92);
    // window frame ring (outer minus inner) + mullions
    float fOut = box(p,vec2(wcx,wcy),vec2(wu+.006,wv+.006),.006);
    float fIn = box(p,vec2(wcx,wcy),vec2(wu-.006,wv-.006),.006);
    float frame = max(0., fOut - fIn);
    frame = max(frame, box(p,vec2(.50,wcy),vec2(.005,wv),.003));
    frame = max(frame, box(p,vec2(wcx,.30),vec2(wu,.005),.003));
    rgb = mix(rgb,vec3(.30,.32,.36),frame*.85);
    // desk (below window)
    rgb = mix(rgb,vec3(.42,.44,.48),box(p,vec2(.50,.56),vec2(.30,.012),.006)*.9);
    rgb = mix(rgb,vec3(.42,.44,.48)*.8,box(p,vec2(.24,.50),vec2(.012,.05),.004)*.9);
    rgb = mix(rgb,vec3(.42,.44,.48)*.8,box(p,vec2(.76,.50),vec2(.012,.05),.004)*.9);
    // office chair silhouette (lower right)
    rgb = mix(rgb,vec3(.18,.20,.24),box(p,vec2(.62,.585),vec2(.06,.03),.02));
    rgb = mix(rgb,vec3(.18,.20,.24),box(p,vec2(.62,.635),vec2(.05,.02),.02));
    rgb = mix(rgb,vec3(.20,.22,.26),box(p,vec2(.62,.665),vec2(.010,.030),.003));
    // houseplant (lower-left by window: terracotta pot + saturated foliage)
    rgb = mix(rgb,vec3(.40,.24,.15),box(p,vec2(.160,.545),vec2(.034,.030),.005));
    rgb = mix(rgb,vec3(.20,.58,.30),disc(p,vec2(.160,.585),vec2(.090,.105),.35)*.96);
    rgb = mix(rgb,vec3(.30,.68,.38),disc(p,vec2(.205,.620),vec2(.068,.072),.30)*.95);
    rgb = mix(rgb,vec3(.42,.74,.44),disc(p,vec2(.128,.628),vec2(.062,.058),.30)*.92);
    return rgb;
  }

  void main() {
    vec2 screen = screenUV;
    float vignette = smoothstep(.08,.73,length((screen - vec2(.5,.68))*vec2(.93,.81)));
    vec3 rgb = mix(lower, upper, smoothstep(-.12,.81,screen.y));
    rgb = rgb * (1.-.082*vignette) + vec3(.025) * (1.-vignette)*sin(screen.y*3.14159);
    vec2 p = vec2(.5+(screen.x-.5)*clamp(aspect/1.6,.42,1.6),1.-screen.y);
    if (kind == 1.) rgb = pow(max(vec3(0.),study(p)),vec3(2.2));
    if (kind == 2.) rgb = pow(max(vec3(0.),bedroom(p)),vec3(2.2));
    if (kind == 3.) rgb = pow(max(vec3(0.),office(p)),vec3(2.2));
    gl_FragColor = vec4(rgb,1.);
    #include <colorspace_fragment>
  }
`;

export const fabricVertex = /* glsl */`
  attribute vec3 restPosition;
  varying vec3 wetPoint;
  varying vec3 localPoint;
  varying vec3 facing;
  varying vec3 eyeDirection;
  void main() {
    localPoint = restPosition;
    wetPoint = position;
    vec4 viewPoint = modelViewMatrix * vec4(position, 1.);
    facing = normalize(normalMatrix * normal);
    eyeDirection = -viewPoint.xyz;
    gl_Position = projectionMatrix * viewPoint;
  }
`;

export const fabricFragment = /* glsl */`
  uniform vec3 dye;
  uniform vec3 wetDye;
  uniform vec3 tint;
  uniform float lengthLimit;
  uniform float band;
  uniform float denier;
  uniform float fabric;
  uniform float cuff;
  uniform float pattern;
  uniform float secret;
  uniform float garter;
  uniform float skinOnly;
  uniform float reflection;
  uniform float time;
  uniform vec4 stains[24];
  varying vec3 wetPoint;
  varying vec3 localPoint;
  varying vec3 facing;
  varying vec3 eyeDirection;

  float hash(vec2 p) {
    return fract(sin(dot(p,vec2(19.27,112.9))) * 8372.356);
  }
  float shape(float id, vec2 p) {
    vec2 f = fract(p) - .5;
    if (id == 1.) return 1. - smoothstep(.13,.17,length(f));
    if (id == 2.) return 1. - smoothstep(.40,.49,abs(f.x)+abs(f.y));
    if (id == 3.) return smoothstep(.41,.48,max(abs(f.x),abs(f.y)));
    if (id == 4.) return step(.54,fract(p.y));
    if (id == 5.) return step(.87,fract(p.x));
    if (id == 6.) return 1. - smoothstep(.015,.035,abs(fract(p.x/9.+.5)-.5));
    if (id == 7.) {
      float h = f.x*f.x + f.y*f.y - .075;
      return float(h*h*h - f.x*f.x*f.y*f.y*f.y < 0.);
    }
    if (id == 8.) return 1.-smoothstep(.02,.053, length(f)*(1.35+.65*cos(atan(f.y,f.x)*5.)));
    if (id == 9.) return smoothstep(.10,.22,abs(sin(p.x*6.28)*sin(p.y*6.28)));
    if (id == 10.) return smoothstep(.2,.8,localPoint.y);
    if (id == 11.) {
      float palm = 1.-smoothstep(.10,.14,length(f+vec2(0.,.09)));
      float toes = 1.-smoothstep(.044,.064,length(vec2(abs(abs(f.x)-.09)-.045,f.y-.09)));
      return max(palm,toes);
    }
    return 0.;
  }
  void main() {
    vec3 n = normalize(facing);
    vec3 view = normalize(eyeDirection);
    vec3 light = normalize(vec3(-.50,.67,.72));
    float incidence = clamp(dot(n,view),0.,1.);
    float diffuse = dot(n,light);
    float modeled = smoothstep(-.55,.70,diffuse);
    float shade = mix(.68,1.06,modeled);
    vec3 skin = mix(vec3(.68,.46,.45),vec3(.89,.73,.72),modeled);
    skin *= mix(vec3(.88,.80,.84),vec3(1.),smoothstep(.01,.70,incidence));
    float h = localPoint.y;
    float angle = atan(localPoint.x+.006,localPoint.z-.030) / 6.2831853 + .5;
    vec2 textile = vec2(angle*17.,h*14.);
    float knit = (hash(floor(vec2(angle*1400.,h*1500.))) - .5) * .019;
    float shine = pow(max(0.,dot(n,normalize(light+view))),mix(25.,85.,step(1.5,fabric)));
    float stocking = step(h, lengthLimit + (cuff == 1. ? .0048 * (.5+.5*cos(angle*125.6637)) : 0.));
    float edge = stocking * step(lengthLimit-band,h);
    vec3 rgb = skin;
    if (stocking > 0. && skinOnly == 0.) {
      float dense = clamp(.41 + denier * .0037 + max(0.,fabric-2.)*.19, .41, .96);
      vec3 base = mix(skin * vec3(.86,.86,.88),dye,dense);
      base *= mix(.82,1.16,modeled);
      float print = shape(pattern,textile);
      if (pattern == 3.) base = mix(skin,base,print);
      else if (pattern == 4.) base = mix(base, vec3(.81,.80,.85)*shade,print*.76);
      else base *= 1. - .42 * print;
      float wetness = 0.;
      for (int i = 0; i < 24; i++) {
        vec4 mark = stains[i];
        if (mark.w <= 0.) continue;
        vec3 delta = wetPoint-mark.xyz;
        float radius = mark.w;
        float ripple = .86+.14*sin(dot(localPoint,vec3(107.,146.,82.)));
        float blob = 1. - smoothstep(radius*.67,radius*ripple,length(delta));
        float meander = sin(delta.y*56.+mark.x*45.)*.006;
        float drip = 1.-smoothstep(radius*.06+.002,radius*.12+.004,length(vec2(delta.x+meander,delta.z*.66)));
        drip *= smoothstep(-radius*4.,-radius*.55,delta.y) * (1.-step(0.,delta.y));
        wetness = max(wetness, max(blob,drip*.65));
      }
      vec3 wet = mix(base*.61,skin,.81 - .27*step(3.5,fabric));
      wet = mix(wet,wetDye,step(.001,dot(wetDye,wetDye))*.72);
      if (secret > 0.) wet *= 1. - .42*shape(secret,textile);
      if (fabric >= 6.) wet = base;
      rgb = mix(base,wet,wetness);
      rgb += knit * mix(1.,.22,wetness);
      rgb += shine * (.035 + .12*wetness + .13*float(fabric==2.) + .34*step(6.,fabric));
      float fresnel = pow(1.-incidence,2.7);
      rgb = mix(rgb, mix(dye,vec3(.38,.36,.46),.35),fresnel*.47);
      if (edge > 0.) {
        float offset = (lengthLimit - h) / max(band,.001);
        float detail = .49;
        if (cuff == 1.) {
          vec2 petal = vec2(fract(angle*20.)-.5,offset-.42);
          float bloom = length(petal) * (1. + .23*cos(atan(petal.y,petal.x)*5.));
          float flower = 1.-smoothstep(.158,.212,bloom);
          float seam = float(offset > .89 || (offset>.10 && offset<.148));
          float lace = float(sin(angle*331.+offset*37.) * cos(angle*429.-offset*34.) > .49);
          detail = .20 + .61 * max(seam,flower) + .13 * lace;
        }
        if (cuff == 2.) detail = .12+.78*float(abs(offset-.3)<.10 || abs(offset-.66)<.10);
        if (cuff == 3.) detail = .29+.42*pow(.5+.5*sin(angle*782.),2.);
        rgb = mix(rgb, mix(dye,vec3(.07,.055,.07),.28),detail);
      }
      rgb = mix(rgb,vec3(.023,.022,.036),(1. - smoothstep(.02,.27,incidence))*.86);
    }
    if (garter > 0. && skinOnly == 0. && h > lengthLimit && abs(fract(angle*2.+.3)-.5)<.086) {
      rgb = mix(rgb,dye,.77);
    }
    rgb *= tint;
    float fade = 1. - smoothstep(.783,.861,h);
    if (reflection > 0.) fade *= reflection*(1.-smoothstep(-.03,.34,h));
    gl_FragColor = vec4(max(rgb,0.),fade);
    #include <colorspace_fragment>
  }
`;

export const outlineVertex = /* glsl */`
  attribute vec3 restPosition;
  varying float height;
  void main() {
    height = restPosition.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position+normal*.0018,1.);
  }
`;

export const outlineFragment = /* glsl */`
  uniform float lengthLimit;
  varying float height;
  void main() {
    float stocking = 1. - smoothstep(lengthLimit-.005,lengthLimit+.004,height);
    vec3 pigment = mix(vec3(.33,.16,.16),vec3(.018,.016,.023),stocking);
    float alpha = mix(.52,.91,stocking)*(1.-smoothstep(.747,.852,height));
    gl_FragColor = vec4(pigment,alpha);
    #include <colorspace_fragment>
  }
`;

export const dropletVertex = /* glsl */`
  varying vec3 facing;
  varying vec3 eyeDirection;
  void main() {
    vec3 p = position;
    vec3 n = normal;
    #ifdef USE_INSTANCING
      p = (instanceMatrix * vec4(p, 1.)).xyz;
      n = normalize(mat3(instanceMatrix) * n);
    #endif
    vec4 viewPoint = modelViewMatrix * vec4(p, 1.);
    facing = normalize(normalMatrix * n);
    eyeDirection = -viewPoint.xyz;
    gl_Position = projectionMatrix * viewPoint;
  }
`;

export const dropletFragment = /* glsl */`
  varying vec3 facing;
  varying vec3 eyeDirection;
  void main() {
    vec3 n = normalize(facing);
    vec3 v = normalize(eyeDirection);
    vec3 light = normalize(vec3(-.55,.83,.62));
    float fresnel = pow(1.-max(0.,dot(n,v)),2.);
    float specular = pow(max(0.,dot(n,normalize(v+light))),25.);
    float oval = smoothstep(.12,.72,dot(n,light));
    vec3 color = mix(vec3(.48,.49,.57),vec3(.92,.96,1.),oval);
    color = mix(color,vec3(1.),specular*.94);
    gl_FragColor = vec4(color,.16 + .35*fresnel + .64*specular);
    #include <colorspace_fragment>
  }
`;

export const rippleVertex = /* glsl */`
  attribute float aAlpha;
  varying float fade;
  void main() {
    vec3 p = position;
    #ifdef USE_INSTANCING
      p = (instanceMatrix * vec4(p, 1.)).xyz;
    #endif
    fade = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
  }
`;

export const rippleFragment = /* glsl */`
  varying float fade;
  void main() {
    gl_FragColor = vec4(.969, .953, .992, fade);
    #include <colorspace_fragment>
  }
`;
