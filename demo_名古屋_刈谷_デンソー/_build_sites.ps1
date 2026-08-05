$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding $false
$Root = $PSScriptRoot
$htmlBase = [System.IO.File]::ReadAllText((Join-Path $Root '_base.html'), $utf8)
$Foot = './assets/denso_logo_foot.png?v=2'
$Logo128 = './assets/denso_logo_128.png?v=2'
$Gas = 'https://script.google.com/macros/s/AKfycbzSTsappgfJTaJruOBJsbnCXSTPkeTBp39CXpvoSZsPQ0mWGs4KjSonC8_eZ2b1EeUXTQ/exec'

function D([string]$b64) { $utf8.GetString([Convert]::FromBase64String($b64)) }
function U([int[]]$codes) { -join ($codes | ForEach-Object { [char]$_ }) }

$T = @{
  denso       = D '44OH44Oz44K944O8'
  densoKK     = D '5qCq5byP5Lya56S+44OH44Oz44K944O8'
  nagoyaCity  = D '5ZCN5Y+k5bGL5biC'
  kariyaCity  = D '5YiI6LC35biC'
  aichi       = D '5oSb55+l55yM'
  nagoya      = D '5ZCN5Y+k5bGL'
  obu         = D '5aSn5bqc'
  aichiNagoya = D '5oSb55+l55yM5ZCN5Y+k5bGL5biC'
  kariyaAddr  = D '44CSNDQ4LTg2NjEg5oSb55+l55yM5YiI6LC35biC5pit5ZKM55S6MeS4geebrjHnlarlnLA='
  densoNagoya = D '44OH44Oz44K944O877yI5ZCN5Y+k5bGL77yJ'
  densoKariya = D '44OH44Oz44K944O877yI5YiI6LC377yJ'
  titleNagoya = D 'V0JHVCBTaWduYWdlIDXpnaIgLSDjg4fjg7Pjgr3jg7wg5ZCN5Y+k5bGL5biC'
  titleKariya = D 'V0JHVCBTaWduYWdlIDXpnaIgLSDjg4fjg7Pjgr3jg7wg5YiI6LC35biC'
  wbgtNagoya  = D 'V0JHVCAvIEFNZURBUyA1MTEwNiAo5ZCN5Y+k5bGLKQ=='
  wbgtKariya  = D 'V0JHVCAvIEFNZURBUyA1MTIxNiAo5aSn5bqcKSAvIOijnOWujCA1MTEwNg=='
  toyotaCity  = D '6LGK55Sw5biC'
  toyota      = D '6LGK55Sw'
  toyotaWest  = D '6LGK55Sw5biC6KW/6YOo'
  zent        = D '44K844Oz44OI'
  srcLabel    = (U 0x51FA,0x5178,0xFF1A,0x6C17,0x8C61,0x5E81,0x30FB,0x74B0,0x5883,0x7701,0x30C7,0x30FC,0x30BF)
  sagyou      = (U 0x4F5C,0x696D,0x6240)
  kaijou      = (U 0x4F1A,0x5834)
  nochiiki    = (U 0x306E,0x5730,0x57DF,0x3067,0x767A,0x8868,0x3055,0x308C,0x3066,0x3044,0x307E,0x3059)
  motorAlt    = 'MOTOR SPORTS produced by ZENT'
}

$sites = @(
  [pscustomobject]@{
    id='nagoya'; file='index-nagoya.html'; comment_id='wbgt-cube-aichi-nagoya-denso-5face'
    comment_site=$T.densoNagoya; comment_addr=$T.aichiNagoya; comment_wbgt=$T.wbgtNagoya
    title=$T.titleNagoya; customer=$T.densoKK; label=$T.denso; address=$T.aichiNagoya
    locationLabel=$T.nagoyaCity; moe_point='51106'; moe_fallback=''; moe_pointName=$T.nagoya
    moe_alertArea=$T.aichi; moe_region='05'; moe_prefecture='51'
    amedas='51106'; amedas_sup=''; forecastArea='230000'; forecastLabel=$T.nagoyaCity
    warnArea='230000'; warnCity='2310000'
    warn_labels_js=("{ '2310000': '" + $T.nagoyaCity + "', '230000': '" + $T.aichi + "' }")
    lat='35.1667'; lon='136.9650'; cache_key='nagoya_denso_5face_signage_state_v1'
  },
  [pscustomobject]@{
    id='kariya'; file='index-kariya.html'; comment_id='wbgt-cube-aichi-kariya-denso-5face'
    comment_site=$T.densoKariya; comment_addr=$T.kariyaAddr; comment_wbgt=$T.wbgtKariya
    title=$T.titleKariya; customer=$T.densoKK; label=$T.denso; address=$T.kariyaAddr
    locationLabel=$T.kariyaCity; moe_point='51216'; moe_fallback='51106'; moe_pointName=$T.obu
    moe_alertArea=$T.aichi; moe_region='05'; moe_prefecture='51'
    amedas='51216'; amedas_sup='51106'; forecastArea='230000'; forecastLabel=$T.kariyaCity
    warnArea='230000'; warnCity='2321000'
    warn_labels_js=("{ '2321000': '" + $T.kariyaCity + "', '230000': '" + $T.aichi + "' }")
    lat='34.9893'; lon='137.0021'; cache_key='kariya_denso_5face_signage_state_v1'
  }
)

function Apply-Site([string]$html, $s) {
  # Header
  $html = [regex]::Replace($html, '<!-- wbgt-cube-aichi-toyota-zent-5face[^>]*-->', "<!-- $($s.comment_id) / $($T.denso) WBGT 5face -->")
  $html = [regex]::Replace($html, '<!--[^>\n]*zent_logo_128\.png[^>\n]*-->', '<!-- assets/denso_logo_128.png / assets/denso_logo_foot.png -->')
  $html = [regex]::Replace($html, '<!-- ' + [regex]::Escape($T.kaijou) + ': [^>\n]*-->', "<!-- $($T.kaijou): $($s.comment_addr) -->")
  $html = [regex]::Replace($html, '<!-- WBGT[^>\n]*AMeDAS[^>\n]*-->', "<!-- $($s.comment_wbgt) -->")
  $html = [regex]::Replace($html, '<title>[^<]*</title>', "<title>$($s.title)</title>")

  # Assets / fonts: Google Fonts CDN + DENSO logos（ローカル woff2 はアップロード件数対策で持たない）
  $html = [regex]::Replace($html, '\./assets/zent_logo_128\.png\?v=\d+', $Logo128)
  $html = [regex]::Replace($html, '\./assets/zent_logo_foot\.png\?v=\d+', $Foot)
  $html = $html.Replace('./assets/zent_logo_128.png', $Logo128)
  $html = $html.Replace('./assets/zent_logo_foot.png', $Foot)
  $cdnFonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;700;900&family=M+PLUS+Rounded+1c:wght@700&display=block">'
  $html = [regex]::Replace($html, '<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]+">', $cdnFonts)
  $html = [regex]::Replace($html, '<link rel="stylesheet" href="\./assets/fonts/[^"]+">', $cdnFonts)

  # SignageConfig block
  $sig = $html.IndexOf('global.SignageConfig = cfg;')
  if ($sig -lt 0) { throw 'SignageConfig assign not found' }
  $start = $html.LastIndexOf('(function (global)', $sig)
  $endMark = "})(typeof window !== 'undefined' ? window : global);"
  $end = $html.IndexOf($endMark, $sig)
  if ($start -lt 0 -or $end -lt 0) { throw 'config block bounds not found' }
  $end += $endMark.Length

  $cfgLines = @(
    '(function (global) {',
    "  'use strict';",
    '',
    '  var cfg = {',
    '    site: {',
    "      customer: '$($s.customer)',",
    "      rental: '',",
    "      label: '$($s.label)',",
    "      address: '$($s.address)',",
    "      locationLabel: '$($s.locationLabel)'",
    '    },',
    '    moe: {',
    '      gasUrl:',
    "        '$Gas',",
    "      point: '$($s.moe_point)',",
    "      fallbackPoint: '$($s.moe_fallback)',",
    "      pointName: '$($s.moe_pointName)',",
    "      alertArea: '$($s.moe_alertArea)',",
    "      region: '$($s.moe_region)',",
    "      prefecture: '$($s.moe_prefecture)'",
    '    },',
    '    jma: {',
    "      amedasPoint: '$($s.amedas)',",
    "      amedasSupplementPoint: '$($s.amedas_sup)',",
    "      forecastArea: '$($s.forecastArea)',",
    "      forecastLabel: '$($s.forecastLabel)',",
    "      warnArea: '$($s.warnArea)',",
    "      warnCity: '$($s.warnCity)'",
    '    },',
    "    geo: { lat: $($s.lat), lon: $($s.lon) },",
    "    timeZone: 'Asia/Tokyo',",
    '    refreshMs: 60000,',
    "    footSource: '$($T.srcLabel)'",
    '  };',
    '',
    '  global.SignageConfig = cfg;',
    '',
    '  global.SIGNAGE_CONFIG = {',
    "    logoSrc: '$Logo128',",
    "    logoAlt: '$($s.label)',",
    "    logoPanelBg: '#F30131',",
    "    logoCorpSrc: '',",
    "    footLogoSrc: '',",
    "    footBannerSrc: '$Foot'",
    '  };',
    "})(typeof window !== 'undefined' ? window : global);"
  )
  $html = $html.Remove($start, $end - $start).Insert($start, [string]::Join("`n", $cfgLines))

  # Location strings (Toyota -> target city)
  $html = $html.Replace(($T.toyotaCity + $T.nochiiki), ($s.locationLabel + $T.nochiiki))
  $html = $html.Replace(('>' + $T.toyotaCity + '</div>'), ('>' + $s.locationLabel + '</div>'))
  $html = $html.Replace(("|| '" + $T.toyotaCity + "';"), ("|| '$($s.locationLabel)';"))
  $html = $html.Replace(('alt="' + $T.motorAlt + '"'), ('alt="' + $s.label + '"'))
  $html = $html.Replace('alt="ZENT"', ('alt="' + $s.label + '"'))
  $html = $html.Replace(("|| '" + $T.zent + "'"), ("|| '" + $s.label + "'"))
  $html = $html.Replace(("siteName || '" + $T.zent + "'"), ("siteName || '" + $s.label + "'"))
  $html = $html.Replace(("getS1SiteFootName_() || '" + $T.zent + "'"), ("getS1SiteFootName_() || '" + $s.label + "'"))
  $html = $html.Replace(("|| '" + $T.motorAlt + "'"), ("|| '" + $s.label + "'"))

  # Runtime defaults (Toyota 51116 -> site)
  $html = $html.Replace("|| (SITE_CFG.moe && SITE_CFG.moe.point) || '51116';", "|| (SITE_CFG.moe && SITE_CFG.moe.point) || '$($s.moe_point)';")
  $html = $html.Replace("|| (SITE_CFG.jma && SITE_CFG.jma.amedasPoint) || '51116';", "|| (SITE_CFG.jma && SITE_CFG.jma.amedasPoint) || '$($s.amedas)';")
  $html = $html.Replace('const DEFAULT_GEO_LAT = (SITE_CFG.geo && SITE_CFG.geo.lat) || 35.08922;', "const DEFAULT_GEO_LAT = (SITE_CFG.geo && SITE_CFG.geo.lat) || $($s.lat);")
  $html = $html.Replace('const DEFAULT_GEO_LON = (SITE_CFG.geo && SITE_CFG.geo.lon) || 137.15453;', "const DEFAULT_GEO_LON = (SITE_CFG.geo && SITE_CFG.geo.lon) || $($s.lon);")
  $html = $html.Replace("const SIGNAGE_STATE_CACHE_KEY = 'aichi_toyota_zent_signage_state_v1';", "const SIGNAGE_STATE_CACHE_KEY = '$($s.cache_key)';")
  $html = $html.Replace("|| (SITE_CFG.jma && SITE_CFG.jma.warnCity) || '2321101';", "|| (SITE_CFG.jma && SITE_CFG.jma.warnCity) || '$($s.warnCity)';")
  $html = [regex]::Replace($html, "const JMA_WARN_CITY_LABELS = \{[^;]+\};", "const JMA_WARN_CITY_LABELS = $($s.warn_labels_js);")
  $html = [regex]::Replace($html, '/\* ' + [regex]::Escape($T.toyotaWest) + ' \*/', "/* $($s.locationLabel) */")
  $html = $html.Replace(("|| '" + $T.toyotaCity + "')"), ("|| '" + $s.locationLabel + "')"))
  $html = $html.Replace(("|| '" + $T.toyota + "')"), ("|| '" + $s.locationLabel + "')"))

  # dualChild hook
  $qLine = '    const query = new URLSearchParams(window.location.search);'
  if (-not $html.Contains($qLine)) { throw 'query line not found' }
  if ($html -notmatch 'DUAL_CHILD') {
    $html = $html.Replace($qLine, $qLine + "`n    const DUAL_CHILD = query.get('dualChild') === '1';")
  }

  $oldFinish = "    function finishMainLoopToS1_() {`n        if (DEMO_SIGNAGE && !DEMO_ONLY) { advanceDemoLevel(); return; }`n        transitionToScene(s1, playScene1);`n    }"
  $newFinish = "    function finishMainLoopToS1_() {`n        if (DEMO_SIGNAGE && !DEMO_ONLY) { advanceDemoLevel(); return; }`n        if (typeof DUAL_CHILD !== 'undefined' && DUAL_CHILD) {`n            try { window.parent.postMessage({ type: 'signage-loop-end', site: '$($s.id)' }, '*'); } catch (_) {}`n            return;`n        }`n        transitionToScene(s1, playScene1);`n    }"
  if ($html.Contains($oldFinish)) {
    $html = $html.Replace($oldFinish, $newFinish)
  } else {
    $old2 = $oldFinish.Replace("`n", "`r`n")
    $new2 = $newFinish.Replace("`n", "`r`n")
    if (-not $html.Contains($old2)) { throw 'finishMainLoopToS1_ block not found' }
    $html = $html.Replace($old2, $new2)
  }
  return $html
}

foreach ($s in $sites) {
  $out = Apply-Site $htmlBase $s
  [System.IO.File]::WriteAllText((Join-Path $Root $s.file), $out, $utf8)
  Write-Host "OK $($s.file)"
}

$dual = @'
<!DOCTYPE html>
<!-- wbgt-cube-aichi-nagoya-kariya-denso-5face / DENSO alternate Nagoya/Kariya 5face -->
<html lang="ja" class="native-640">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <title>WBGT Signage 5face - DENSO Nagoya / Kariya</title>
  <style>
    html, body { margin: 0; padding: 0; width: 640px; height: 128px; overflow: hidden; background: #000; }
    iframe { display: block; border: 0; width: 640px; height: 128px; background: #000; }
    body.browser-preview { min-height: 100vh; width: 100%; display: flex; background: #1a1a1a; }
    body.browser-preview iframe { transform: scale(min(calc(100vw / 640), calc(100vh / 128))); transform-origin: top left; }
  </style>
  <script>
  (function () {
    var q = new URLSearchParams(location.search);
    var localDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    var forceNative = localDev ? q.get('native640') === '1' : q.get('native640') !== '0';
    if (!forceNative) document.documentElement.classList.add('browser-preview');
    document.addEventListener('DOMContentLoaded', function () {
      document.body.classList.add(forceNative ? 'native-640' : 'browser-preview');
    });
  })();
  </script>
</head>
<body class="native-640">
  <iframe id="signage-frame" title="DENSO WBGT Signage"></iframe>
  <script>
  (function () {
    var pages = [
      './index-nagoya.html?dualChild=1&native640=1',
      './index-kariya.html?dualChild=1&native640=1'
    ];
    var idx = 0;
    var frame = document.getElementById('signage-frame');
    function show() {
      frame.src = pages[idx] + '&_=' + Date.now();
      console.log('[dual] show', idx === 0 ? 'nagoya' : 'kariya');
    }
    window.addEventListener('message', function (ev) {
      if (!ev.data || ev.data.type !== 'signage-loop-end') return;
      idx = (idx + 1) % pages.length;
      show();
    });
    show();
  })();
  </script>
</body>
</html>
'@
[System.IO.File]::WriteAllText((Join-Path $Root 'index-dual.html'), $dual, $utf8)
Write-Host 'OK index-dual.html'
