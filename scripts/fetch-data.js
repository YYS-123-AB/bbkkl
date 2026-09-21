/* ============================================================
   fetch-data.js - 使用 Node.js 原生 https 模块抓取灾害模拟数据
   如果在线抓取失败，会自动生成 60+ 条高质量示例数据写入 data.json
   使用方式: node scripts/fetch-data.js
   ============================================================ */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

const DISASTER_TYPES = [
  { key: 'typhoon', name: '台风', icon: '🌀' },
  { key: 'earthquake', name: '地震', icon: '🌋' },
  { key: 'flood', name: '洪水', icon: '🌊' },
  { key: 'rainstorm', name: '暴雨', icon: '⛈️' },
  { key: 'snowstorm', name: '暴雪', icon: '❄️' },
  { key: 'drought', name: '干旱', icon: '🏜️' },
  { key: 'wildfire', name: '森林火灾', icon: '🔥' },
  { key: 'heatwave', name: '高温', icon: '🥵' },
  { key: 'coldwave', name: '寒潮', icon: '🥶' }
];

const PROVINCES = [
  { name: '北京', lat: 39.92, lng: 116.45 },
  { name: '上海', lat: 31.23, lng: 121.48 },
  { name: '天津', lat: 39.13, lng: 117.20 },
  { name: '重庆', lat: 29.56, lng: 106.55 },
  { name: '广东', lat: 23.13, lng: 113.26 },
  { name: '广西', lat: 22.82, lng: 108.37 },
  { name: '福建', lat: 26.08, lng: 119.30 },
  { name: '浙江', lat: 30.27, lng: 120.15 },
  { name: '江苏', lat: 32.06, lng: 118.79 },
  { name: '山东', lat: 36.67, lng: 117.00 },
  { name: '河北', lat: 38.04, lng: 114.51 },
  { name: '河南', lat: 34.76, lng: 113.65 },
  { name: '湖北', lat: 30.59, lng: 114.31 },
  { name: '湖南', lat: 28.20, lng: 112.98 },
  { name: '安徽', lat: 31.82, lng: 117.23 },
  { name: '江西', lat: 28.68, lng: 115.89 },
  { name: '四川', lat: 30.67, lng: 104.07 },
  { name: '贵州', lat: 26.65, lng: 106.63 },
  { name: '云南', lat: 25.04, lng: 102.72 },
  { name: '陕西', lat: 34.27, lng: 108.95 },
  { name: '山西', lat: 37.87, lng: 112.55 },
  { name: '甘肃', lat: 36.06, lng: 103.83 },
  { name: '青海', lat: 36.62, lng: 101.78 },
  { name: '宁夏', lat: 38.47, lng: 106.28 },
  { name: '新疆', lat: 43.80, lng: 87.60 },
  { name: '西藏', lat: 29.65, lng: 91.14 },
  { name: '内蒙古', lat: 40.84, lng: 111.75 },
  { name: '黑龙江', lat: 45.75, lng: 126.65 },
  { name: '吉林', lat: 43.88, lng: 125.32 },
  { name: '辽宁', lat: 41.80, lng: 123.43 },
  { name: '海南', lat: 20.02, lng: 110.35 },
  { name: '台湾', lat: 25.04, lng: 121.56 }
];

const LEVELS = ['normal', 'severe', 'serious', 'catastrophic'];
const STATUSES = ['warning', 'ongoing', 'rescue', 'ended'];

function rand(n) { return Math.floor(Math.random() * n); }
function pick(arr) { return arr[rand(arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function pickLocation(province) {
  const extras = {
    '广东': ['广州市天河区', '深圳市南山区', '珠海市香洲区', '湛江市徐闻县', '汕头市潮阳区', '惠州市惠东县'],
    '福建': ['福州市连江县', '厦门市思明区', '泉州市晋江市', '漳州市东山县', '宁德市霞浦县'],
    '浙江': ['杭州市西湖区', '宁波市象山县', '温州市瑞安市', '舟山市定海区', '台州市温岭市'],
    '江苏': ['南京市鼓楼区', '苏州市姑苏区', '无锡市滨湖区', '南通市通州区', '盐城市响水县'],
    '山东': ['济南市历下区', '青岛市市南区', '烟台市芝罘区', '潍坊市寿光市', '泰安市东平县'],
    '四川': ['成都市锦江区', '甘孜州泸定县', '雅安市汉源县', '绵阳市北川县', '阿坝州汶川县'],
    '云南': ['昆明市五华区', '大理州漾濞县', '曲靖市陆良县', '丽江市玉龙县', '玉溪市江川区'],
    '湖北': ['武汉市武昌区', '宜昌市西陵区', '襄阳市襄城区', '荆州市沙市区', '黄冈市黄梅县'],
    '湖南': ['长沙市岳麓区', '岳阳市岳阳楼区', '常德市武陵区', '张家界市永定区', '郴州市苏仙区'],
    '河南': ['郑州市金水区', '洛阳市西工区', '开封市龙亭区', '南阳市宛城区', '新乡市红旗区'],
    '河北': ['石家庄市长安区', '保定市涿州市', '唐山市路北区', '邯郸市丛台区', '廊坊市三河市'],
    '北京': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '门头沟区', '房山区'],
    '上海': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '浦东新区'],
    '天津': ['和平区', '河东区', '河西区', '南开区', '滨海新区'],
    '重庆': ['渝中区', '江北区', '沙坪坝区', '九龙坡区', '黔江区'],
    '台湾': ['台北市中正区', '高雄市三民区', '台中市西区', '台南市安平区', '花莲县'],
    '海南': ['海口市龙华区', '三亚市海棠区', '三沙市', '文昌市', '琼海市'],
    '广西': ['南宁市青秀区', '桂林市秀峰区', '北海市海城区', '防城港市港口区', '柳州市城中区'],
    '贵州': ['贵阳市南明区', '遵义市红花岗区', '黔东南州榕江县', '毕节市七星关区', '铜仁市'],
    '甘肃': ['兰州市城关区', '临夏州积石山县', '甘南州舟曲县', '定西市安定区', '陇南市文县'],
    '青海': ['西宁市城中区', '果洛州玛多县', '玉树州玉树市', '海北州门源县', '海东市乐都区'],
    '新疆': ['乌鲁木齐市天山区', '伊犁州伊宁市', '吐鲁番市高昌区', '喀什地区喀什市', '和田地区和田市', '克孜勒苏州阿合奇县'],
    '西藏': ['拉萨市城关区', '日喀则市桑珠孜区', '昌都市卡若区', '林芝市巴宜区', '阿里地区噶尔县'],
    '内蒙古': ['呼和浩特市赛罕区', '包头市昆都仑区', '通辽市科尔沁区', '呼伦贝尔市海拉尔区', '鄂尔多斯市东胜区'],
    '黑龙江': ['哈尔滨市南岗区', '齐齐哈尔市龙沙区', '牡丹江市东安区', '佳木斯市向阳区', '大庆市萨尔图区', '大兴安岭漠河市'],
    '吉林': ['长春市南关区', '吉林市船营区', '四平市铁西区', '延边州延吉市', '通化市东昌区'],
    '辽宁': ['沈阳市和平区', '大连市中山区', '鞍山市铁东区', '抚顺市新抚区', '丹东市振兴区'],
    '江西': ['南昌市东湖区', '九江市浔阳区', '赣州市章贡区', '吉安市吉州区', '上饶市信州区'],
    '安徽': ['合肥市包河区', '蚌埠市蚌山区', '黄山市屯溪区', '安庆市迎江区', '马鞍山市雨山区'],
    '陕西': ['西安市新城区', '宝鸡市渭滨区', '咸阳市秦都区', '渭南市临渭区', '延安市宝塔区'],
    '山西': ['太原市小店区', '大同市平城区', '长治市潞州区', '临汾市尧都区', '运城市盐湖区'],
    '宁夏': ['银川市兴庆区', '石嘴山市大武口区', '吴忠市利通区', '中卫市沙坡头区', '固原市原州区']
  };
  const list = extras[province];
  return list ? pick(list) : province + '省某市某区';
}

function randomDateRecent(days = 200) {
  const now = new Date();
  now.setDate(now.getDate() - rand(days));
  now.setHours(randInt(0, 23), randInt(0, 59), 0);
  return now.toISOString().slice(0, 19);
}

function genTitle(type, province, level) {
  const lv = { normal: '', severe: '大', serious: '特大', catastrophic: '罕见特大' };
  const templates = {
    typhoon: [
      `台风"${['马鞍','蝎虎','尼伯特','苗柏','桑达','暹芭','奥鹿','轩岚诺','梅花','南玛都'][rand(10)]}"登陆${province} 沿海多地停课停工`,
      `${lv[level] || '强'}台风逼近${province} 沿海风力达到${randInt(8, 16)}级`,
      `超强台风重创${province} 多地风雨潮三碰头`
    ],
    earthquake: [
      `${province}${['某地','某县','海域','交界处'][rand(4)]}发生${(randInt(38,72)/10).toFixed(1)}级地震 部分房屋受损`,
      `${province}发生${lv[level] || '中强'}地震 震源深度${randInt(5, 30)}千米`,
      `${province}突发地震 相关部门启动应急响应`
    ],
    flood: [
      `${province}发生流域性大洪水 多条河流超警`,
      `${province}${['长江','黄河','淮河','珠江','松花江'][rand(5)]}干流水位超警 启动应急响应`,
      `${lv[level] || '严重'}洪涝灾害袭击${province} 多地紧急转移群众`
    ],
    rainstorm: [
      `${province}遭遇${lv[level] || '特大'}暴雨 局地降雨量突破${randInt(150, 500)}毫米`,
      `${province}${['城区','山区','平原','盆地'][rand(4)]}发生暴雨内涝 交通受阻`,
      `华北雨季开启 ${province}特大暴雨突破历史极值`
    ],
    snowstorm: [
      `${province}遭遇${lv[level] || '特大'}暴风雪 积雪深度达${randInt(20, 80)}厘米`,
      `${province}${['山区','平原','牧区','林区'][rand(4)]}暴雪成灾 交通电力中断`,
      `${province}出现罕见寒潮暴雪组合灾害`
    ],
    drought: [
      `${province}发生${lv[level] || '严重'}旱情 部分水库接近死水位`,
      `${province}${['伏秋连旱','冬春连旱','春夏连旱','四季连旱'][rand(4)} 农田受旱严重`,
      `特大旱情席卷${province} 数十万人饮水困难`
    ],
    wildfire: [
      `${province}${['林区','山区','自然保护区','风景名胜区'][rand(4)]}发生森林火灾 千人扑救`,
      `${province}山火蔓延 极端高温增加扑救难度`,
      `${province}森林火灾持续 救援力量紧急驰援`
    ],
    heatwave: [
      `${province}${lv[level] || '持续'}高温 气温突破${randInt(38, 52)}℃ 打破历史纪录`,
      `极端高温热浪席卷${province} 电网负荷屡创新高`,
      ${`"${province}发布高温红色预警 体感温度超45℃"`}
    ],
    coldwave: [
      `${lv[level] || '强'}寒潮席卷${province} 气温骤降${randInt(10, 25)}℃`,
      `${province}${['入冬','年末','春季','秋季'][rand(4)]}遭遇罕见低温 跌破零下${randInt(10, 50)}℃`,
      `霸王级寒潮横扫${province} 启动供暖应急预案`
    ]
  };
  return pick(templates[type.key] || templates.flood);
}

function genContent(type, province, location, level, status) {
  const statusText = {
    warning: '目前处于预警阶段',
    ongoing: '灾害正在持续发展',
    rescue: '救援力量正在全力处置',
    ended: '灾害已结束，正在进行灾后恢复重建'
  };
  const typeText = type.name;
  const levelText = { normal: '一般', severe: '较重', serious: '严重', catastrophic: '特别重大' }[level];
  return `据权威部门发布消息，${province}${location}近期发生${levelText}${typeText}灾害。${statusText[status] || '相关部门正在持续监测事态发展'}。此次灾害已影响到当地群众的生产生活，各级政府和应急管理部门第一时间启动应急预案，组织力量开展抢险救援、受灾群众转移安置、救灾物资调运等工作。专家提醒，当前正值灾害高发期，请当地居民密切关注官方预警信息，提高安全防范意识，避免前往危险区域。如遇紧急情况，请立即拨打应急救援电话12350或119求助。社会各界爱心人士如有意提供援助，可通过官方渠道的援助链接进行捐赠或参与志愿活动。`;
}

function generateDisasters() {
  const list = [];
  let id = 1;
  for (const type of DISASTER_TYPES) {
    const perType = 7;
    for (let i = 0; i < perType; i++) {
      const province = pick(PROVINCES);
      const level = LEVELS[Math.min(LEVELS.length - 1, i % 4 + (rand(2) ? 0 : 0))];
      const status = STATUSES[i % STATUSES.length];
      const location = pickLocation(province.name);
      const occurTime = randomDateRecent(220);
      const endTime = status === 'ended' ? (() => {
        const d = new Date(occurTime);
        d.setDate(d.getDate() + randInt(1, 15));
        return d.toISOString().slice(0, 19);
      })() : undefined;
      const affectedBase = { normal: 5000, severe: 30000, serious: 120000, catastrophic: 450000 }[level];
      const affected = affectedBase + rand(affectedBase);
      const casualties = level === 'catastrophic' ? randInt(8, 45) : level === 'serious' ? randInt(2, 15) : level === 'severe' ? randInt(0, 4) : (rand(10) < 2 ? 1 : 0);
      const propertyLoss = { normal: randInt(30, 200), severe: randInt(200, 800), serious: randInt(800, 3000), catastrophic: randInt(3000, 9000) }[level];
      const rescueCount = { normal: 500, severe: 1500, serious: 3000, catastrophic: 5500 }[level] + rand(800);
      const rescueForces = `${province.name}消防救援总队${rescueCount}人${['、武警部队', '、解放军驻当地部队', '、专业抢险力量', '、社会救援队'][rand(4)]}${randInt(300, 2000)}人`;
      const supplies = [
        `帐篷${randInt(1000, 8000)}顶`,
        `方便食品${randInt(2000, 15000)}箱`,
        `饮用水${randInt(3000, 25000)}箱`,
        `棉被${randInt(1000, 20000)}床`,
        `发电机${randInt(50, 800)}台`,
        `应急药品${randInt(10, 200)}吨`,
        `救生衣${randInt(500, 5000)}件`,
        `冲锋舟${randInt(50, 500)}艘`
      ].sort(() => Math.random() - 0.5).slice(0, randInt(4, 8)).join('、');
      list.push({
        id: id++,
        title: genTitle(type, province.name, level),
        disasterType: type.key,
        level,
        status,
        location,
        province: province.name,
        lat: province.lat + (Math.random() - 0.5) * 2,
        lng: province.lng + (Math.random() - 0.5) * 2,
        occurTime,
        ...(endTime ? { endTime } : {}),
        affectedPeople: affected,
        casualties,
        propertyLoss,
        rescueForces,
        supplies,
        summary: `${province.name}${location}发生${levelText}${type.name}灾害，${statusText[status] || ''}，目前已造成约${(affected/10000).toFixed(1)}万人受灾。`,
        content: genContent(type, province.name, location, level, status),
        mapImage: `https://picsum.photos/seed/${type.key}${id}/800/400`,
        source: `${province.name}${['应急管理厅','气象局','地震局','水利厅','林业厅','卫健委'][rand(6)]}`,
        aidUrl: `https://example.com/aid/${province.name}${id}`
      });
    }
  }
  return list.sort((a, b) => new Date(b.occurTime) - new Date(a.occurTime));
}

function fetchRemote(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('请求超时')), timeout);
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 DisasterInfoBot/1.0' } }, (res) => {
      clearTimeout(timer);
      if (res.statusCode < 200 || res.statusCode >= 400) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', (e) => { clearTimeout(timer); reject(e); });
    req.end();
  });
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function writeData(disasters) {
  ensureDir();
  const payload = {
    generatedAt: new Date().toISOString(),
    count: disasters.length,
    disasters
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`✅ 数据写入成功！共 ${disasters.length} 条 -> ${path.relative(process.cwd(), DATA_FILE)}`);
}

async function main() {
  console.log('🌩️  自然灾害资讯数据获取工具');
  console.log('='.repeat(40));
  console.log('📡 尝试从远程获取灾害数据 (示例接口)...');

  const tryUrls = [
    'https://api.example.com/disasters/latest.json',
    'https://data.example.com/gov/disaster.json'
  ];

  let remoteSuccess = false;
  for (const url of tryUrls) {
    try {
      console.log(`   · 尝试 ${url} ...`);
      const text = await fetchRemote(url);
      const json = JSON.parse(text);
      const arr = json.disasters || json.data || json;
      if (Array.isArray(arr) && arr.length >= 30) {
        writeData(arr);
        console.log('🎉 成功从远程接口获取到数据！');
        remoteSuccess = true;
        break;
      }
    } catch (_e) {
      console.log(`   ✗ 失败，继续尝试下一个...`);
    }
  }

  if (!remoteSuccess) {
    console.log('⚠️  远程接口不可用，自动生成本地示例数据...');
    const list = generateDisasters();
    writeData(list);
    console.log('✅ 已生成 ' + list.length + ' 条高质量示例数据。');
    const stat = {};
    list.forEach(d => { stat[d.disasterType] = (stat[d.disasterType] || 0) + 1; });
    console.log('📊 类型分布:');
    for (const t of DISASTER_TYPES) {
      console.log(`   ${t.icon} ${t.name.padEnd(6, ' ')}: ${String(stat[t.key] || 0).padStart(2, ' ')} 条`);
    }
    console.log('='.repeat(40));
    console.log('🚀 数据准备完成，可以运行 npm run dev 启动项目。');
  }
}

main().catch(err => {
  console.error('❌ 发生致命错误:', err.message);
  console.log('⚠️  尝试直接生成示例数据...');
  try {
    writeData(generateDisasters());
  } catch (e2) {
    console.error('💀 生成数据也失败:', e2.message);
    process.exit(1);
  }
});
