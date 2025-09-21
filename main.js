// 音频管理器
class AudioManager {
  constructor() {
    this.audioElements = {};
    this.currentBGM = null;
    this.isFishing = false;
    this.initAudioElements();
  }

  initAudioElements() {
    // 音频文件配置：分为核心音频和延迟加载音频
    const audioFiles = {
      // 核心音频：游戏开始时立即加载
      core: {
        bgm01: 'sound/bgm01.mp3',
        clicks: 'sound/clicks.OGG',
        keyboardClicks: 'sound/keyboardclicks.mp3',
        tips: 'sound/Tips.OGG'
      },
      // 延迟音频：按需加载
      lazy: {
        fishingbgm01: 'sound/fishingbgm01.MP3',
        fishingbgm02: 'sound/fishingbgm02.MP3',
        fishingbgm03: 'sound/fishingbgm03.mp3',
        fishingbgm04: 'sound/fishingbgm04.MP3',
        fishingbgm05: 'sound/fishingbgm05.MP3',
        bossbgm01: 'sound/bossbgm01.OGG',
        bossbgm02: 'sound/bossbgm02.OGG',
        bossbgm03: 'sound/bossbgm03.OGG',
        endOfDay: 'sound/endoftheday.OGG',
        randomEvents: 'sound/randomevents.OGG',
        citynight: 'sound/citynight.OGG',
        citynight01: 'sound/citynight01.OGG'
      }
    };

    // 立即加载核心音频
    Object.entries(audioFiles.core).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.loop = key.startsWith('bgm') || key.startsWith('fishingbgm') || key.startsWith('bossbgm');
      this.audioElements[key] = audio;
    });

    // 延迟加载其他音频
    Object.entries(audioFiles.lazy).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'none'; // 不预加载
      audio.loop = key.startsWith('bgm') || key.startsWith('fishingbgm') || key.startsWith('bossbgm');
      this.audioElements[key] = audio;
    });

    this.lazyAudioFiles = audioFiles.lazy;
    this.loadedLazyAudio = new Set();
  }

  // 播放BGM
  playBGM(type = 'bgm01') {
    // 停止当前BGM
    if (this.currentBGM && this.currentBGM !== type) {
      this.audioElements[this.currentBGM].pause();
      this.audioElements[this.currentBGM].currentTime = 0;
    }

    // 播放新的BGM
    this.currentBGM = type;
    this.audioElements[type].play().catch(e => console.log('音频播放失败:', e));
  }

  // 停止BGM
  stopBGM() {
    if (this.currentBGM) {
      this.audioElements[this.currentBGM].pause();
      this.audioElements[this.currentBGM].currentTime = 0;
      this.currentBGM = null;
    }
  }

  // 延迟加载音频
  async loadLazyAudio(audioKey) {
    if (this.loadedLazyAudio.has(audioKey)) return;
    
    const audio = this.audioElements[audioKey];
    if (audio && this.lazyAudioFiles[audioKey]) {
      try {
        // 触发加载
        audio.load();
        this.loadedLazyAudio.add(audioKey);
        console.log(`延迟加载音频: ${audioKey}`);
      } catch (e) {
        console.log(`音频加载失败: ${audioKey}`, e);
      }
    }
  }

  // 播放音效（不循环）
  playSFX(sfxName, volume = null) {
    const audio = this.audioElements[sfxName];
    if (audio) {
      // 如果是延迟加载的音频且未加载，先加载
      if (this.lazyAudioFiles[sfxName] && !this.loadedLazyAudio.has(sfxName)) {
        this.loadLazyAudio(sfxName);
      }
      
      // 保存原始音量
      const originalVolume = audio.volume;
      // 如果指定了音量，则使用指定音量，否则使用原始音量
      if (volume !== null) {
        audio.volume = volume;
      }
      audio.currentTime = 0;
      audio.play().catch(e => console.log('音效播放失败:', e));
      // 播放完成后恢复原始音量（仅对非循环音效）
      if (!audio.loop) {
        audio.addEventListener('ended', () => {
          audio.volume = originalVolume;
        }, { once: true });
      }
    }
  }

  // 开始摸鱼BGM
  startFishingBGM() {
    this.isFishing = true;
    const random = Math.random();
    let fishingBGM;
    
    if (random < 0.05) {
      // 5% 概率选择 fishingbgm04
      fishingBGM = 'fishingbgm04';
    } else {
      // 剩余95%概率平分给其他4个BGM，每个23.75%
      const otherBGMs = ['fishingbgm01', 'fishingbgm02', 'fishingbgm03', 'fishingbgm05'];
      fishingBGM = otherBGMs[Math.floor((random - 0.05) / 0.95 * 4)];
    }
    
    // 延迟加载摸鱼BGM
    if (this.lazyAudioFiles[fishingBGM] && !this.loadedLazyAudio.has(fishingBGM)) {
      this.loadLazyAudio(fishingBGM);
    }
    
    this.playBGM(fishingBGM);
  }

  // 停止摸鱼BGM，回到正常BGM
  stopFishingBGM() {
    this.isFishing = false;
    this.playBGM('bgm01');
  }

  // 设置音量
  setVolume(volume) {
    Object.values(this.audioElements).forEach(audio => {
      audio.volume = volume;
    });
  }
}

// 资源预加载管理器
class ResourceLoader {
  constructor() {
    this.totalResources = 0;
    this.loadedResources = 0;
    this.loadingCallbacks = [];
  }

  // 预加载图片
  preloadImages() {
    const images = [
      'img/background/background-start.png',
      'img/background/background-01.png.png',
      'img/background/Morning.png',
      'img/background/Night.png',
      'img/ui/ui-boss.png',
      'img/ui/ui-boss-01.png'
    ];

    return Promise.all(images.map(src => this.loadImage(src)));
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.onResourceLoaded();
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`图片加载失败: ${src}`);
        this.onResourceLoaded(); // 即使失败也算完成，避免卡住
        resolve(null);
      };
      img.src = src;
      this.totalResources++;
    });
  }

  onResourceLoaded() {
    this.loadedResources++;
    const progress = Math.round((this.loadedResources / this.totalResources) * 100);
    this.updateProgress(progress);
  }

  updateProgress(progress) {
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
    
    if (loadingBar) loadingBar.style.width = `${progress}%`;
    if (loadingText) loadingText.textContent = `加载中 ${progress}%`;

    if (progress >= 100) {
      this.onLoadingComplete();
    }
  }

  onLoadingComplete() {
    setTimeout(() => {
      const loadingOverlay = document.getElementById('loadingOverlay');
      const startOverlay = document.getElementById('startOverlay');
      
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (startOverlay) startOverlay.classList.remove('hidden');
    }, 500); // 短暂延迟，让用户看到100%
  }

  async init() {
    console.log('开始预加载资源...');
    await this.preloadImages();
    console.log('资源预加载完成');
  }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager();
const resourceLoader = new ResourceLoader();

// 设置默认音量
audioManager.setVolume(0.3); // 30%音量，避免过于吵闹

// 核心游戏逻辑
(() => {
  const ONE_DAY_SECONDS = 4 * 60; // 4分钟=一天（秒）
  const WORK_TARGET_CLICKS = 400; // 每日点击总量

  // 状态
  const state = {
    day: 1, // 从1开始，1..5为周一..周五
    secondsLeft: ONE_DAY_SECONDS,
    clicksToday: 0,
    mood: 100,
    money: 800,
    isFishing: false,
    bossVisible: false,
    // per-minute/random event control
    lastMinuteMark: -1,
    lockEventOrBoss: false,
    lastEventMinute: -1,
    lastScriptedEventCheck: -1, // 固定事件检查标记
    // fishing/boss
    fishAccumSec: 0,
    bossAccumSec: 0,
    bossActiveWindowId: null,
    dailyCaught: 0,
    weeklyCaught: 0,
    // performance
    weeklyBasePerf: 0, // 累计每日绩效（0-50）
    weeklyExtraPerf: 0, // 加班额外绩效（每次+2，最高20）
    dailyPenaltyPerf: 0, // 当日扣绩效（被抓摸鱼-1/次）
    overtimeOfferedDay: 0,
    // mood streak
    lowMoodDaysStreak: 0, // 连续<60天数
    dayEnded: false, // 当日是否已结算
    workDoneNotified: false, // 当日工作完成提示是否已显示
    pausedForEvent: false, // 随机事件期间暂停计时/摸鱼/老板
    currentBossVariant: 'boss', // 'boss' | 'boss01' 当前出现的boss形象
    gameEnded: false, // 游戏是否已结束（显示结局页面）
    // expenses tracking
    dailyEventExpenses: 0, // 当日随机事件花费
    weeklyEventExpenses: 0, // 本周随机事件累计花费
    // relationship system
    relationship: 60, // 关系值，基础60分，隐藏值
    relationshipEventTriggered: false, // 是否已触发关系值低于40的事件
    // event tracking
    dailyTriggeredEvents: [], // 当日已触发的随机事件ID列表
    // story flags for branching events
    storyFlags: {}, // 存储剧情选择标记
    // ending tracking variables
    highPerfWeeksStreak: 0, // 连续高绩效周数（≥80分）
    perfectFishWeeksStreak: 0, // 连续完美摸鱼周数（高绩效+零被抓）
    socialEventCount: 0, // 参与社交事件次数
    earlyFinishDaysStreak: 0, // 连续提前完成工作天数
  };

  // UI 引用
  const clockEl = document.getElementById('clock');
  const moodBar = document.getElementById('moodBar');
  const perfBar = document.getElementById('perfBar');
  const moodVal = document.getElementById('moodVal');
  const perfVal = document.getElementById('perfVal');
  const moneyVal = document.getElementById('moneyVal');
  const workProgress = document.getElementById('workProgress');
  const workProgressPct = document.getElementById('workProgressPct');
  const keyboardBtn = document.getElementById('keyboardBtn');
  const fishToggle = document.getElementById('fishToggle');
  const fishPanel = document.getElementById('fishPanel');
  const fishClose = document.getElementById('fishClose');
  const bossEl = document.getElementById('boss');
  const modal = document.getElementById('eventModal');
  const eventTitle = document.getElementById('eventTitle');
  const eventDesc = document.getElementById('eventDesc');
  const opt1 = document.getElementById('eventOpt1');
  const opt2 = document.getElementById('eventOpt2');
  const toast = document.getElementById('toast');
  const startOverlay = document.getElementById('startOverlay');
  const startBtn = document.getElementById('startBtn');
  const daycycleOverlay = document.getElementById('daycycleOverlay');
  const daycycleNight = document.getElementById('daycycleNight');
  const daycycleMorning = document.getElementById('daycycleMorning');

  // 随机事件表
  const events = [
    {
      id: 'colleague_help',
      title: '同事求助',
      desc: '同事让你帮忙整理文件',
      a: { label: '帮一把', mood:-2, perf:+0, money:+0, relationship:+2 },
      b: { label: '婉拒', mood:+1, perf:+0, money:+0, relationship:-3 },
    },
    {
      id: 'takeout_coupon',
      title: '外卖红包',
      desc: '抢到大额券，加奶茶补充快乐',
      a: { label: '点！', mood:+3, perf:+0, money:-25, relationship:+0 },
      b: { label: '忍住', mood:-1, perf:+0, money:+0, relationship:+0 },
    },
    {
      id: 'urgent_request',
      title: '加急需求',
      desc: '主管突然来个加急任务',
      a: { label: '收到', mood:-3, perf:+1, money:+0, relationship:+0 },
      b: { label: '明天再说', mood:+2, perf:-1, money:+0, relationship:-1 },
    },
    {
      id: 'new_gacha',
      title: '上新卡池了',
      desc: '花点钱快乐一下？小心上头!',
      a: { label: '十连！', mood:+3, perf:+0, money:-100, relationship:+0 },
      b: { label: '克制', mood:+1, perf:+0, money:+0, relationship:+0 },
    },
    {
      id: 'colleague_birthday',
      title: '同事生日',
      desc: '大家AA蛋糕',
      a: { label: '参与AA', mood:+1, perf:+0, money:-30, relationship:+3 },
      b: { label: '口头祝福', mood:+3, perf:+0, money:+0, relationship:-3 },
    },
    {
      id: 'team_building',
      title: '部门团建',
      desc: 'K歌+自助',
      a: { label: '报名', mood:+1, perf:+0, money:+0, relationship:+2 },
      b: { label: '不去', mood:+2, perf:+0, money:+0, relationship:-3 },
    },
    {
      id: 'bathroom_smoking',
      title: '厕所事件',
      desc: '总是有人偷偷在厕所抽烟',
      a: { label: '默默忍受', mood:-2, perf:+0, money:+0, relationship:+0 },
      b: { label: '大群开喷', mood:+5, perf:+0, money:+0, relationship:+1 },
    },
    {
      id: 'daily_report',
      title: '日报没写',
      desc: '摸鱼摸得忘乎所以',
      a: { label: '加班补', mood:-2, perf:+0, money:+0, relationship:+0 },
      b: { label: '偷抄同事的', mood:+2, perf:-1, money:+0, relationship:+0 },
    },
    {
      id: 'lunch_choice',
      title: '吃饭犹豫',
      desc: '外卖还是食堂?',
      a: { label: '豪华外卖', mood:+3, perf:+0, money:-25, relationship:+0 },
      b: { label: '公司食堂', mood:-1, perf:+0, money:+0, relationship:+0 },
    },
    {
      id: 'overtime_question',
      title: '今晚加班吗',
      desc: '老板最近似乎很焦虑',
      a: { label: '加班', mood:-2, perf:+2, money:+0, relationship:+0 },
      b: { label: '加个屁', mood:+3, perf:-3, money:+0, relationship:+1 },
    },
    {
      id: 'lottery_ticket',
      title: '买彩票吗',
      desc: '搏一把单车变摩托',
      a: { label: '买！', mood:+0, perf:+0, money:-10, relationship:+0, special: 'lottery' },
      b: { label: '算了算了', mood:-1, perf:+0, money:+0, relationship:+0 },
    },
  ];

  // 固定事件表（按条件和时间触发）
  const scriptedEvents = [
    // === 第一周事件 ===
    
    // 第1天 - 初入职场
    {
      id: 'DAY1_MENTOR_INTRO',
      day: 1,
      title: '前辈的关照',
      desc: '直属领导林雨萱主动过来关心你的适应情况，还给你带了杯咖啡',
      a: { label: '感谢并请教工作', mood:+3, perf:+1, money:+0, relationship:+3 },
      b: { label: '礼貌感谢就好', mood:+1, perf:+0, money:+0, relationship:+1 },
      condition: null,
      character: 'mentor', // 前辈
      flags: { mentor_closeness: 'A' } // A选项会设置亲近标记
    },

    // 第2天 - 遇到甩锅同事
    {
      id: 'DAY2_BLAME_GAME',
      day: 2,
      title: '背锅侠的诞生',
      desc: '王志强把他负责的bug说成是"新人不熟悉导致的"，所有人都看向了你',
      a: { label: '据理力争', mood:-2, perf:+0, money:+0, relationship:-1 },
      b: { label: '默默承受', mood:-5, perf:-1, money:+0, relationship:+2 },
      condition: null,
      character: 'annoying', // 讨厌同事
      flags: { annoying_first_impression: 'A_or_B' }
    },

    // 第3天 - 跨组合作开始
    {
      id: 'DAY3_CROSS_TEAM',
      day: 3,
      title: '新的合作',
      desc: '需要和其他组的张小雅对接项目，她看起来很专业但有点严肃',
      a: { label: '主动沟通项目细节', mood:+1, perf:+2, money:+0, relationship:+2 },
      b: { label: '按部就班完成对接', mood:+0, perf:+1, money:+0, relationship:+0 },
      condition: null,
      character: 'partner', // 跨组同事
      flags: { partner_impression: 'A_or_B' }
    },

    // 第4天 - 前辈的指导（基于第1天选择）
    {
      id: 'DAY4_MENTOR_GUIDANCE',
      day: 4,
      title: '深度指导',
      desc: '林雨萱注意到你工作中的一些问题，决定单独指导你',
      a: { label: '虚心学习', mood:+2, perf:+3, money:+0, relationship:+3 },
      b: { label: '觉得有压力', mood:-1, perf:+2, money:+0, relationship:+1 },
      condition: { type: 'flag', flag: 'mentor_closeness', value: 'A' },
      character: 'mentor'
    },

    // 第5天 - 周末加班
    {
      id: 'DAY5_WEEKEND_WORK',
      day: 5,
      title: '周末的选择',
      desc: '项目进度紧张，林雨萱提议周末来公司加班赶进度',
      a: { label: '主动参与', mood:-3, perf:+3, money:+0, relationship:+3 },
      b: { label: '推说有事', mood:+2, perf:-1, money:+0, relationship:-2 },
      condition: null,
      character: 'mentor',
      flags: { weekend_work: 'A_or_B' }
    },

    // === 第二周事件 ===

    // 第8天 - 跨组同事的可靠表现
    {
      id: 'DAY8_PARTNER_RELIABLE',
      day: 8,
      title: '意外的帮助',
      desc: '张小雅发现了项目中的一个重大风险，及时提醒了你，避免了大问题',
      a: { label: '真诚感谢', mood:+3, perf:+2, money:+0, relationship:+4 },
      b: { label: '觉得理所当然', mood:+1, perf:+2, money:+0, relationship:-1 },
      condition: null,
      character: 'partner',
      flags: { partner_trust: 'A_or_B' }
    },

    // 张小雅的额外事件
    {
      id: 'DAY4_XIAOYA_LUNCH',
      day: 4,
      title: '午餐邀请',
      desc: '张小雅主动邀请你一起去公司楼下的小餐厅吃午饭，说想聊聊项目的想法',
      a: { label: '欣然接受', mood:+2, perf:+0, money:-20, relationship:+3 },
      b: { label: '说自己带了饭', mood:+0, perf:+0, money:+0, relationship:-1 },
      condition: null,
      character: 'partner',
      flags: { xiaoya_lunch: 'A_or_B' }
    },


    {
      id: 'DAY9_XIAOYA_SKILL',
      day: 9,
      title: '技能分享',
      desc: '张小雅注意到你在某个技术点上有困惑，主动分享了她的经验和小技巧',
      a: { label: '认真学习并请教', mood:+1, perf:+2, money:+0, relationship:+3 },
      b: { label: '客气感谢', mood:+1, perf:+1, money:+0, relationship:+1 },
      condition: null,
      character: 'partner'
    },

    {
      id: 'DAY10_XIAOYA_SUPPORT',
      day: 10,
      title: '默默支持',
      desc: '你在会议上提出的方案被质疑，张小雅在会后私下对你说"我觉得你的想法很有道理"',
      a: { label: '感到被理解', mood:+3, perf:+0, money:+0, relationship:+4 },
      b: { label: '觉得她只是安慰', mood:+1, perf:+0, money:+0, relationship:+1 },
      condition: null,
      character: 'partner',
      flags: { xiaoya_support: 'A_or_B' }
    },

    {
      id: 'DAY11_XIAOYA_CRISIS_HELP',
      day: 11,
      title: '危机时刻的援助',
      desc: '项目出问题时，张小雅主动加班帮你分析数据，找出了问题的根源',
      a: { label: '深深感谢她的帮助', mood:+2, perf:+2, money:+0, relationship:+5 },
      b: { label: '认为这是团队合作', mood:+1, perf:+2, money:+0, relationship:+2 },
      condition: null,
      character: 'partner'
    },

    {
      id: 'DAY12_XIAOYA_PERSONAL',
      day: 12,
      title: '私人话题',
      desc: '张小雅难得和你聊起工作以外的话题，分享了她对职场生活的一些看法',
      a: { label: '分享自己的想法', mood:+2, perf:+0, money:+0, relationship:+3 },
      b: { label: '主要是倾听', mood:+1, perf:+0, money:+0, relationship:+2 },
      condition: { type: 'flag', flag: 'xiaoya_support', value: 'A' },
      character: 'partner',
      flags: { xiaoya_friendship: 'A_or_B' }
    },

    // 第9天 - 讨厌同事的另一面
    {
      id: 'DAY9_ANNOYING_HELP',
      day: 9,
      title: '意想不到的援手',
      desc: '王志强看到你被客户刁难，主动站出来帮你解围，虽然方式有点粗暴',
      a: { label: '感谢他的帮助', mood:+2, perf:+0, money:+0, relationship:+3 },
      b: { label: '觉得他别有用心', mood:-1, perf:+0, money:+0, relationship:-1 },
      condition: null,
      character: 'annoying',
      flags: { annoying_complex: 'A_or_B' }
    },

    // 第10天 - 前辈的私人谈话
    {
      id: 'DAY10_MENTOR_PERSONAL',
      day: 10,
      title: '下班后的谈话',
      desc: '林雨萱下班后邀请你去咖啡厅聊天，她看起来有心事',
      a: { label: '关心询问', mood:+2, perf:+0, money:-15, relationship:+5 },
      b: { label: '只是倾听', mood:+0, perf:+0, money:-15, relationship:+2 },
      condition: { type: 'flag', flag: 'weekend_work', value: 'A' },
      character: 'mentor',
      flags: { mentor_personal: 'A_or_B' }
    },

    // 第9天 - 团队危机
    {
      id: 'DAY9_TEAM_CRISIS',
      day: 9,
      title: '项目危机',
      desc: '项目出现重大问题，需要有人承担责任，王志强第一时间把矛头指向你',
      a: { label: '据理力争证明清白', mood:-3, perf:+0, money:+0, relationship:-2 },
      b: { label: '主动承担责任', mood:-5, perf:-2, money:+0, relationship:+1 },
      condition: null,
      character: 'annoying',
      flags: { crisis_response: 'A_or_B' }
    },

    // 第10天 - 前辈的离别暗示
    {
      id: 'DAY12_MENTOR_HINT',
      day: 12,
      title: '不寻常的话语',
      desc: '林雨萱今天格外关心你的工作能力，还问你"如果我不在了，你能独当一面吗？"',
      a: { label: '敏感地察觉异常', mood:-2, perf:+0, money:+0, relationship:+3 },
      b: { label: '以为是正常关心', mood:+1, perf:+0, money:+0, relationship:+1 },
      condition: { type: 'flag', flag: 'mentor_personal', value: 'A' },
      character: 'mentor',
      flags: { mentor_leaving_hint: 'A_or_B' }
    },

    // 特殊事件 - 高关系值触发
    {
      id: 'RELATIONSHIP_80_BONUS',
      day: null,
      title: '同事们的认可',
      desc: '大家都觉得你很靠谱，主动分享了一些工作小技巧',
      a: { label: '表示感谢', mood:+5, perf:+3, money:+0, relationship:+2 },
      b: { label: '低调接受', mood:+3, perf:+2, money:+0, relationship:+0 },
      condition: { type: 'relationship', value: 80 },
      triggered: false,
      character: 'general'
    }
  ];

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
  function formatTime(sec){ const m = Math.floor(sec/60).toString().padStart(2,'0'); const s = (sec%60).toString().padStart(2,'0'); return `${m}:${s}`; }
  // 将实时秒映射为游戏内 09:00-18:00 的时间显示
  function formatWorkdayClock(secondsLeft){
    const elapsed = ONE_DAY_SECONDS - secondsLeft; // 实际已过秒
    const ingameSeconds = 9 * 3600 + Math.floor(elapsed * 135); // 4分钟映射9小时 => 每秒135秒
    const h = Math.floor(ingameSeconds / 3600);
    const m = Math.floor((ingameSeconds % 3600) / 60);
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  }
  function weekdayName(day){
    // 处理跳过周末的天数：1-5为第一周，8-12为第二周，15-19为第三周...
    let adjustedDay;
    if(day <= 5) {
      adjustedDay = day;
    } else {
      // 计算是第几个工作周期（每个周期7天：5工作日+2周末）
      const weekCycle = Math.floor((day - 1) / 7);
      const dayInCycle = ((day - 1) % 7) + 1;
      
      if(dayInCycle <= 5) {
        adjustedDay = dayInCycle; // 工作日
      } else {
        adjustedDay = 1; // 周末后的周一
      }
    }
    return ['','周一','周二','周三','周四','周五'][adjustedDay];
  }
  function showToast(text, type = 'info'){
    // 游戏已结束时不再显示任何提示框
    if (state.gameEnded) return;
    
    const toastTitle = document.getElementById('toastTitle');
    const toastDesc = document.getElementById('toastDesc');
    const toastClose = document.getElementById('toastClose');
    
    if (toastTitle && toastDesc) {
      if (type === 'warning') {
        toastTitle.textContent = '小心老板！';
        toastDesc.textContent = text;
      } else if (type === 'success') {
        toastTitle.textContent = '工作完成！';
        toastDesc.textContent = text;
      } else if (type === 'mood') {
        toastTitle.textContent = '开始摸鱼！';
        toastDesc.textContent = text;
      } else {
        toastTitle.textContent = '提示';
        toastDesc.textContent = text;
      }
    }
    
    // 暂停游戏时间
    state.pausedForEvent = true;
    
    // 警告类型使用居中显示
    if (type === 'warning') {
      toast.classList.add('center');
    } else {
      toast.classList.remove('center');
    }
    
    toast.classList.remove('hidden');
    
    // 播放提示音效
    audioManager.playSFX('tips', 0.6);
    
    // 绑定关闭按钮事件
    if (toastClose) {
      toastClose.onclick = () => {
        toast.classList.add('hidden');
        toast.classList.remove('center');
        // 恢复游戏时间
        state.pausedForEvent = false;
      };
    }
  }

  // 居中提示
  function showCenterToast(text, type = 'info', customTitle = null){
    // 游戏已结束时不再显示任何提示框
    if (state.gameEnded) return;
    
    const toastTitle = document.getElementById('toastTitle');
    const toastDesc = document.getElementById('toastDesc');
    const toastClose = document.getElementById('toastClose');
    
    if (toastTitle && toastDesc) {
      // 如果提供了自定义标题，使用自定义标题
      if (customTitle) {
        toastTitle.textContent = customTitle;
        toastDesc.textContent = text;
      } else if (type === 'warning') {
        toastTitle.textContent = '小心老板！';
        toastDesc.textContent = text;
      } else if (type === 'success') {
        toastTitle.textContent = '工作完成！';
        toastDesc.textContent = text;
      } else if (type === 'mood') {
        toastTitle.textContent = '开始摸鱼！';
        toastDesc.textContent = text;
      } else {
        toastTitle.textContent = '提示';
        toastDesc.textContent = text;
      }
    }
    
    // 暂停游戏时间
    state.pausedForEvent = true;
    
    toast.classList.add('center');
    toast.classList.remove('hidden');
    
    // 播放提示音效
    audioManager.playSFX('tips', 0.6);
    
    // 绑定关闭按钮事件
    if (toastClose) {
      toastClose.onclick = () => {
        toast.classList.add('hidden');
        toast.classList.remove('center');
        // 恢复游戏时间
        state.pausedForEvent = false;
      };
    }
  }

  // 心情UI抖动
  function shakeMoodUI(){
    const moodContainer = moodVal?.parentElement; // div.nstat
    if(!moodContainer) return;
    moodContainer.classList.add('shake-ui');
    setTimeout(()=> moodContainer.classList.remove('shake-ui'), 2000);
  }

  function render(){
    clockEl.textContent = `第${state.day}天 ${weekdayName(state.day)} ${formatWorkdayClock(state.secondsLeft)}`;
    if(moodBar){ moodBar.style.width = `${clamp(state.mood,0,100)}%`; }
    if(moodVal){ moodVal.textContent = clamp(state.mood,0,100).toFixed(0); }
    const dailyProgress = state.clicksToday / WORK_TARGET_CLICKS; // 0..1
    const cappedProgress = clamp(dailyProgress, 0, 1);
    const dailyBasePerf = Math.round((cappedProgress * 10 - state.dailyPenaltyPerf) * 10) / 10; // 一位小数，允许负数
    const shownPerf = Math.max(0, dailyBasePerf); // 显示时保持0以上
    if(perfVal){ perfVal.textContent = shownPerf.toFixed(1); }
    // 钱包显示当前实际余额（基础日支出已在日结算时扣除）
    if(moneyVal){ moneyVal.textContent = Math.max(0, state.money).toFixed(1); }
    if(workProgress){ workProgress.style.width = `${cappedProgress*100}%`; }
    if(workProgressPct){ workProgressPct.textContent = `${Math.round(cappedProgress*100)}%`; }
    if(bossEl){ bossEl.style.display = state.bossVisible ? 'block' : 'none'; }
    if(fishPanel){ fishPanel.classList.toggle('hidden', !state.isFishing); }
  }

  // 运行时探测老板图片，避免文件名/格式不匹配
  (function setupBossImage(){
    if(!bossEl) return;
    const candidates = [
      'img/ui/ui-boss.png.png',
      'img/ui/ui-boss.png',
      'img/ui/ui-boss.webp',
      'img/ui/ui-boss.jpg',
      'img/ui/ui-boss.jpeg',
    ];
    (function tryNext(i){
      if(i>=candidates.length) return;
      const url = candidates[i];
      const img = new Image();
      img.onload = () => { bossEl.style.backgroundImage = `url('${url}')`; };
      img.onerror = () => tryNext(i+1);
      img.src = url;
    })(0);
  })();

  // 固定分辨率缩放（1080x1920）
  function applyViewportScale(){
    const app = document.getElementById('app');
    if(!app) return;
    const vw = window.innerWidth; const vh = window.innerHeight;
    const scale = Math.min(vw / 1080, vh / 1920);
    app.style.setProperty('--scale', String(scale));
  }
  window.addEventListener('resize', applyViewportScale);
  applyViewportScale();

  // 背景交由 CSS 最底层伪元素呈现，移除 JS 背景设置

  function endOfDay(){
    if(state.dayEnded) return; // 防重复
    state.dayEnded = true;
    // 结算时强制关闭摸鱼与老板提示，并关闭事件弹窗
    try { closeFish(); } catch(_) { state.isFishing = false; state.bossVisible = false; }
    try { closeModal(); } catch(_) {}
    // 计算当日绩效（基础10分按完成度，扣除抓包罚分）
    const dailyProgress = Math.min(1, state.clicksToday / WORK_TARGET_CLICKS);
    let dailyPerf = dailyProgress * 10 - state.dailyPenaltyPerf;
    dailyPerf = Math.round(dailyPerf * 10) / 10; // 一位小数，允许负数

    // 心情<60的连续天数统计
    if(state.mood < 60) state.lowMoodDaysStreak += 1; else state.lowMoodDaysStreak = 0;

    // 结局判定（日级）
    if(dailyPerf < 6){ return badEnd('公司不再需要你了（每日绩效不足）'); }
    if(state.mood < 50){ return badEnd('不吃草的马儿（心情过低）'); }
    if(state.dailyCaught >= 3){ return badEnd('再也不用摸鱼了（当日被抓≥3）'); }

    // 纳入周基础绩效
    state.weeklyBasePerf = Math.round((state.weeklyBasePerf + dailyPerf) * 10) / 10;
    
    // 检查是否提前完成工作（16:30前完成，即完成度达到75%且绩效≥10分）
    const finishTime = ONE_DAY_SECONDS - state.secondsLeft;
    const finishRatio = finishTime / ONE_DAY_SECONDS; // 0-1，表示一天中已过去的比例
    const finishHour = 9 + finishRatio * 9; // 9:00-18:00映射
    if (finishHour <= 16.5 && dailyPerf >= 10) {
      state.earlyFinishDaysStreak += 1;
    } else {
      state.earlyFinishDaysStreak = 0;
    }

    // 判断是否为周五：第5天、第12天、第19天...（工作周的最后一天）
    const isFriday = (state.day === 5) || (state.day > 5 && ((state.day - 5) % 7) === 0);
    if(isFriday){
      // 周绩效
      const weeklyPerfTotal = Math.round((state.weeklyBasePerf + Math.min(state.weeklyExtraPerf, 20)) * 10) / 10;
      if(weeklyPerfTotal < 50){ return badEnd('公司不再需要你了（周绩效不足）'); }
      if(state.weeklyCaught >= 5){ return badEnd('再也不用摸鱼了（本周被抓≥5）'); }
      
      // 更新连续周数统计
      if (weeklyPerfTotal >= 80) {
        state.highPerfWeeksStreak += 1;
      } else {
        state.highPerfWeeksStreak = 0;
      }
      
      if (weeklyPerfTotal >= 60 && state.weeklyCaught === 0) {
        state.perfectFishWeeksStreak += 1;
      } else {
        state.perfectFishWeeksStreak = 0;
      }

      // 周结算：工资（1分=40），支出：只有房租800（其他费用已实时扣除）
      const salary = Math.round(weeklyPerfTotal * 40 * 10) / 10; // 一位小数
      const rentExpense = 800; // 只有房租需要扣除
      state.money = Math.round((state.money + salary - rentExpense) * 10) / 10;
      if(state.money < 0){ return badEnd('回老家吧（钱包<0）'); }
      
      // 新的好结局检查（按优先级排序）
      
      // 优先级1: 完美平衡（全能结局）- 最难达成，降低门槛
      if(weeklyPerfTotal >= 60 && state.mood >= 70 && state.relationship >= 65 && state.money >= 2000 && state.day >= 15) {
        return goodEnd('完美平衡！工作、生活、人际关系各方面都表现出色，获得公司海外项目机会');
      }
      
      // 优先级2: 模范员工（连续高绩效）- 需要长期努力
      if(state.highPerfWeeksStreak >= 3) {
        return goodEnd('模范员工！连续高绩效表现获得公司认可，直接晋升为部门主管');
      }
      
      // 优先级3: 摸鱼大师（特殊成就）- 技巧性结局，提高绩效要求
      if(state.perfectFishWeeksStreak >= 3 && weeklyPerfTotal >= 70) {
        return goodEnd('摸鱼大师！在保持高绩效的同时完全没被发现摸鱼，堪称隐藏高手');
      }
      
      // 优先级4: 最佳搭档（张小雅线）- 剧情结局
      if(state.storyFlags.xiaoya_friendship === 'A' && state.relationship >= 70 && state.day >= 15) {
        return goodEnd('最佳搭档！与张小雅建立深厚友谊，两人决定一起跳槽到更好的公司');
      }
      
      // 优先级5: 效率专家（平衡结局）- 中期可达成
      if(weeklyPerfTotal >= 70 && state.weeklyCaught === 0 && state.day >= 12) {
        return goodEnd('效率专家！在高效完成工作的同时从未被抓摸鱼，获得"最佳新人"称号');
      }
      
      // 优先级6: 职场红人（关系值结局）- 社交型结局
      if(state.relationship >= 85 && state.day >= 15) {
        return goodEnd('职场红人！同事们都很信任你，公司决定提前转正并加薪');
      }
      
      // 优先级7: 社交达人（事件结局）- 最容易达成
      if(state.socialEventCount >= 5 && state.relationship >= 65 && state.day >= 20) {
        return goodEnd('社交达人！积极的社交态度让你成为公司文化大使，获得特殊津贴');
      }
      
      // 原有结局：财务自由，降低要求
      if(state.money > 6000){ return goodEnd('辞职摆摊咯~'); }

      // 重置周数据并进入下一周（第day+1天）
      state.weeklyBasePerf = 0; state.weeklyExtraPerf = 0; state.weeklyCaught = 0; state.weeklyEventExpenses = 0; state.lowMoodDaysStreak = (state.mood < 60 ? 1 : 0);
      openWeeklySummaryInternal(weeklyPerfTotal, salary, rentExpense, state.weeklyEventExpenses);
    }

    openDailySummaryInternal(dailyPerf);
  }

  // 结算面板
  const summaryModal = document.getElementById('summaryModal');
  const summaryTitle = document.getElementById('summaryTitle');
  const summaryBody = document.getElementById('summaryBody');
  const summaryNextBtn = document.getElementById('summaryNextBtn');
  function buildSummaryCard({ title, tag, lines, ctaText, currentMoney, dailyExpenses, baseDailyExpenses, showActualMoney }){
    return `
    <div class="modal-content cardized">
      <div class="card">
        <div class="card-pattern-grid"></div>
        <div class="card-overlay-dots"></div>
        <div class="bold-pattern">
          <svg viewBox="0 0 100 100"><path stroke-dasharray="15 10" stroke-width="10" stroke="#000" fill="none" d="M0,0 L100,0 L100,100 L0,100 Z"></path></svg>
        </div>
        <div class="card-title-area">
          <span>${title}</span>
          <span class="card-tag">${tag}</span>
        </div>
        <div class="card-body">
          <div class="card-description">
            ${lines.map(l=>`<div class="${/绩效|心情|开支/.test(l)?'big-line':''}">${l}</div>`).join('')}
          </div>
          <div class="card-actions">
            <div class="price"><span class="price-currency">￥</span>${showActualMoney ? Math.max(0, state.money).toFixed(1) : (baseDailyExpenses !== undefined ? Math.max(0, currentMoney - baseDailyExpenses).toFixed(1) : Math.max(0, state.money).toFixed(1))}<span class="price-period">钱包</span></div>
            <button id="summaryCardBtn" class="card-button">${ctaText}</button>
          </div>
        </div>
        <div class="dots-pattern"><svg viewBox="0 0 80 40">
          <circle fill="#000" r="3" cy="10" cx="10"></circle>
          <circle fill="#000" r="3" cy="10" cx="30"></circle>
          <circle fill="#000" r="3" cy="10" cx="50"></circle>
          <circle fill="#000" r="3" cy="10" cx="70"></circle>
          <circle fill="#000" r="3" cy="20" cx="20"></circle>
          <circle fill="#000" r="3" cy="20" cx="40"></circle>
          <circle fill="#000" r="3" cy="20" cx="60"></circle>
          <circle fill="#000" r="3" cy="30" cx="10"></circle>
          <circle fill="#000" r="3" cy="30" cx="30"></circle>
          <circle fill="#000" r="3" cy="30" cx="50"></circle>
          <circle fill="#000" r="3" cy="30" cx="70"></circle>
        </svg></div>
        <div class="accent-shape"></div>
        <div class="corner-slice"></div>
        <div class="stamp"><span class="stamp-text">Approved</span></div>
      </div>
    </div>`;
  }
  function openDailySummaryInternal(dailyPerf){
    try { closeFish(); } catch(_) { state.isFishing = false; state.bossVisible = false; }
    try { closeModal(); } catch(_) {}
    
    // 播放结算音效
    audioManager.playSFX('endOfDay');
    
    // 判断是否为周五：第5天、第12天、第19天...（工作周的最后一天）
    const isFriday = (state.day === 5) || (state.day > 5 && ((state.day - 5) % 7) === 0);
    
    const dailyTotalExpenses = 80 + state.dailyEventExpenses; // 基础开支80 + 事件开支
    
    // 日结算时实际扣除基础日支出80元
    state.money = Math.round((state.money - 80) * 10) / 10;
    console.log(`第${state.day}天结算 - 扣除基础支出80元后钱包: ${state.money}, 今日总支出: ${dailyTotalExpenses}`);
    
    const cardHTML = buildSummaryCard({
      title: `第${state.day}天 日结算`,
      tag: 'Daily',
      lines: [
        `今日绩效：<b>${dailyPerf.toFixed(1)}</b>`,
        `今日心情：<b>${Math.round(state.mood)}</b>`,
        `今日开支：<b>${dailyTotalExpenses.toFixed(1)}</b>`
      ],
      ctaText: isFriday ? '下一周' : '下一天',
      showActualMoney: true // 显示实际钱包余额
    });
    summaryBody.innerHTML = cardHTML;
    summaryTitle.textContent = '';
    summaryNextBtn.textContent = '';
    summaryModal.classList.remove('hidden');
    document.getElementById('summaryCardBtn')?.addEventListener('click', () => {
      proceedNextDayWithTransition();
    });
  }
  function openWeeklySummaryInternal(weeklyPerfTotal, salary, rentExpense, weeklyEventExpenses){
    try { closeFish(); } catch(_) { state.isFishing = false; state.bossVisible = false; }
    try { closeModal(); } catch(_) {}
    
    // 播放结算音效
    audioManager.playSFX('endOfDay');
    
    // 计算本周总支出用于显示（包含已实时扣除的费用统计）
    const weeklyTotalExpensesDisplay = rentExpense + weeklyEventExpenses + (80 * 5); // 房租 + 事件支出 + 基础日支出统计
    console.log(`周结算 - 实际扣除房租: ${rentExpense}, 统计显示总支出: ${weeklyTotalExpensesDisplay} (房租${rentExpense} + 事件${weeklyEventExpenses} + 基础日支出${80*5})`);
    
    const cardHTML = buildSummaryCard({
      title: '周结算（周五）',
      tag: 'Weekly',
      lines: [
        `本周绩效：<b>${weeklyPerfTotal.toFixed(1)}</b>`,
        `工资：<b>${salary.toFixed(1)}</b>`,
        `本周开支：<b>${weeklyTotalExpensesDisplay.toFixed(1)}</b>`
      ],
      ctaText: '下一周',
    });
    summaryBody.innerHTML = cardHTML;
    summaryTitle.textContent = '';
    summaryNextBtn.textContent = '';
    summaryModal.classList.remove('hidden');
    document.getElementById('summaryCardBtn')?.addEventListener('click', () => {
      proceedNextDayWithTransition();
    });
  }
  // 预加载与设置背景工具
  function resolveImageCandidates(candidates, onResolved){
    (function tryNext(i){
      if(i>=candidates.length){ onResolved(null); return; }
      const url = candidates[i];
      const img = new Image();
      img.onload = () => onResolved(url);
      img.onerror = () => tryNext(i+1);
      img.src = url;
    })(0);
  }

  function playDayCycleTransition(){
    return new Promise((resolve) => {
      console.log('日夜切换检查元素:', {
        overlay: !!daycycleOverlay,
        night: !!daycycleNight, 
        morning: !!daycycleMorning
      });
      
      if(!daycycleOverlay || !daycycleNight || !daycycleMorning){ 
        console.log('日夜切换元素缺失，跳过动画');
        // 确保主界面可见性正常
        const mainApp = document.getElementById('app');
        if(mainApp) mainApp.style.visibility = 'visible';
        resolve(); 
        return; 
      }
      const nightCandidates = [
        'img/background/Night.png',      // 实际文件名（大写N）
        'img/background/night.png',
        'img/background/night.jpg',
        'img/background/night.jpeg',
        'img/background/night.webp',
      ];
      const morningCandidates = [
        'img/background/Morning.png',    // 实际文件名（大写M）
        'img/background/morning.png',
        'img/background/morning.jpg',
        'img/background/morning.jpeg',
        'img/background/morning.webp',
      ];
      // 过场时停止现有BGM并播放 citynight01（循环），过场结束后停止citynight01并恢复BGM
      const previousBGMKey = audioManager.currentBGM;

      resolveImageCandidates(nightCandidates, (nightUrl) => {
        resolveImageCandidates(morningCandidates, (morningUrl) => {
          // 若素材缺失，则直接跳过
          if(!nightUrl || !morningUrl){ 
            // 确保主界面可见性正常
            const mainApp = document.getElementById('app');
            if(mainApp) mainApp.style.visibility = 'visible';
            resolve(); 
            return; 
          }
          console.log('找到日夜切换图片:', { nightUrl, morningUrl });
          
          // 完全模仿主界面的背景设置方式
          console.log('使用主界面相同的背景设置方式');

          // 过场期间隐藏主界面，防止工作界面闪现
          const mainApp = document.getElementById('app');
          const viewportEl = document.getElementById('viewport');
          if(mainApp) {
            mainApp.style.visibility = 'hidden';
            console.log('日夜切换开始，隐藏主界面');
          }
          
          // 直接设置viewport的背景为夜晚图片，就像主界面那样
          if(viewportEl) {
            viewportEl.style.setProperty('--bg-image', `url('${nightUrl}')`);
            console.log('设置viewport背景为夜晚图片:', nightUrl);
          }
          
          // 过场期间禁用键盘，防止误触导致心情变化
          try { keyboardBtn?.setAttribute('disabled','true'); } catch(_) {}

          console.log('开始日夜切换动画');

          // 音频处理
          try {
            // 停止当前BGM
            if(previousBGMKey && audioManager.audioElements[previousBGMKey]){
              audioManager.audioElements[previousBGMKey].pause();
              audioManager.audioElements[previousBGMKey].currentTime = 0;
            }
            // 播放citynight01音效
            const city = audioManager.audioElements.citynight01;
            if(city){
              city.loop = true;
              city.currentTime = 0;
              city.volume = 0.3;
              city.play().catch(() => {});
            }
          } catch(_) {}

          // 夜晚展示 4000ms  
          setTimeout(() => {
            // 开始变暗效果（模拟深夜）
            if(viewportEl) {
              viewportEl.style.filter = 'brightness(0.3)';
              viewportEl.style.transition = 'filter 1000ms ease';
              console.log('夜晚开始变暗');
            }
            
            // 1秒后切换到清晨并开始变亮
            setTimeout(() => {
              if(viewportEl) {
                viewportEl.style.setProperty('--bg-image', `url('${morningUrl}')`);
                viewportEl.style.transition = 'filter 2000ms ease';
                console.log('切换到清晨背景:', morningUrl);
                
                // 开始变亮效果（模拟日出）
                setTimeout(() => {
                  viewportEl.style.filter = 'brightness(1)';
                  console.log('清晨开始变亮');
                }, 100);
              }
            }, 1000);

            // 清晨展示 3000ms（总共8秒：4秒夜晚 + 1秒变暗过渡 + 3秒清晨变亮）
            setTimeout(() => {
              console.log('日夜切换动画结束');
              
              // 过场结束，解除键盘禁用
              try { keyboardBtn?.removeAttribute('disabled'); } catch(_) {}
              
              // 恢复主界面可见性和背景
              const mainApp = document.getElementById('app');
              const viewportRestore = document.getElementById('viewport');
              if(mainApp) {
                mainApp.style.visibility = 'visible';
                console.log('日夜切换结束，恢复主界面');
              }
              
              // 恢复主界面背景
              if(viewportRestore) {
                viewportRestore.style.setProperty('--bg-image', 'url("img/background/background-01.png.png")');
                viewportRestore.style.filter = '';
                viewportRestore.style.transition = '';
                console.log('恢复主界面背景');
              }
              
              // 停止 citynight01 并恢复BGM
              try {
                const city = audioManager.audioElements.citynight01;
                if(city){
                  city.pause();
                  city.currentTime = 0;
                  city.loop = false;
                }
                // 恢复原BGM
                if(previousBGMKey && audioManager.audioElements[previousBGMKey]){
                  audioManager.audioElements[previousBGMKey].currentTime = 0;
                  audioManager.audioElements[previousBGMKey].play().catch(() => {});
                }
              } catch(_) {}
              
              console.log('日夜过场完全结束');
              resolve();
            }, 3000);
          }, 4000);
        });
      });
    });
  }

  function proceedNextDayCore(){
    // 进入下一天，第5天结束后跳到第8天（跳过周末）
    if(state.day === 5){
      state.day = 8; // 跳过周末，直接到下周一
    } else {
      state.day += 1;
    }
    state.secondsLeft = ONE_DAY_SECONDS;
    state.clicksToday = 0;
    state.mood = 100;
    state.dailyPenaltyPerf = 0;
    state.dailyCaught = 0;
    state.dailyEventExpenses = 0; // 重置每日事件开支
    state.dailyTriggeredEvents = []; // 重置当日已触发事件列表
    state.isFishing = false; state.bossVisible = false; clearTimeout(state.bossActiveWindowId); state.bossActiveWindowId = null;
    state.dayEnded = false;
    state.workDoneNotified = false;
    state.pausedForEvent = false; // 确保重置事件暂停状态
    state.lastScriptedEventCheck = -1; // 重置固定事件检查
    keyboardBtn.removeAttribute('disabled');
    
    console.log(`进入第${state.day}天，计时器状态重置完成`);
    render();
  }

  async function proceedNextDayWithTransition(){
    summaryModal.classList.add('hidden');
    try{
      await playDayCycleTransition();
      // 过场动画完成后再更新游戏状态和界面
      proceedNextDayCore();
    } catch(error) {
      console.error('日夜切换动画出错:', error);
      proceedNextDayCore();
    }
  }
  summaryNextBtn?.addEventListener('click', proceedNextDayWithTransition);

  // 结局终端弹窗功能
  function showEndingModal(type, message) {
    const endingModal = document.getElementById('endingModal');
    const endingCommand = document.getElementById('endingCommand');
    const endingResult = document.getElementById('endingResult');
    const endingRestartBtn = document.getElementById('endingRestartBtn');
    
    if (!endingModal || !endingCommand || !endingResult || !endingRestartBtn) return;
    
    // 设置游戏结束状态，防止随机事件继续触发
    state.gameEnded = true;
    
    // 设置命令文本
    const commandText = type === 'bad' ? 'check-status --failure' : 'check-status --success';
    endingCommand.setAttribute('data-cmd', commandText);
    
    // 设置结果文本
    const resultText = type === 'bad' 
      ? `❌ 游戏结束\n\n结局: ${message}\n\n状态: 失败\n建议: 重新开始游戏`
      : `✅ 游戏结束\n\n结果: ${message}\n\n状态: 成功\n恭喜: 达成完美结局`;
    
    endingResult.textContent = resultText;
    
    // 显示模态框
    endingModal.classList.remove('hidden');
    
    // 绑定重新开始按钮事件
    endingRestartBtn.onclick = () => {
      endingModal.classList.add('hidden');
      resetGame();
    };
    
    // 播放结局音效
    if (type === 'bad') {
      audioManager.playSFX('bossbgm01', 0.5);
    } else {
      audioManager.playSFX('endOfDay', 0.8);
    }
  }

  function badEnd(msg){ showEndingModal('bad', msg); }
  function goodEnd(msg){ showEndingModal('good', msg); }
  function resetGame(){
    Object.assign(state, {
      day: 1, secondsLeft: ONE_DAY_SECONDS,
      clicksToday: 0, mood: 100, money: 800,
      isFishing: false, bossVisible:false,
      lastMinuteMark:-1, lockEventOrBoss:false, lastEventMinute:-1, lastScriptedEventCheck:-1,
      fishAccumSec:0, bossAccumSec:0, bossActiveWindowId:null,
      dailyCaught:0, weeklyCaught:0,
      weeklyBasePerf:0, weeklyExtraPerf:0, dailyPenaltyPerf:0,
      overtimeOfferedDay:0, lowMoodDaysStreak:0,
      dayEnded: false,
      workDoneNotified: false,
      gameEnded: false, // 重置游戏结束状态
      dailyEventExpenses: 0, // 重置每日事件开支
      weeklyEventExpenses: 0, // 重置每周事件开支
      relationship: 60, // 重置关系值
      relationshipEventTriggered: false, // 重置关系值事件触发状态
      dailyTriggeredEvents: [], // 重置当日已触发事件列表
      storyFlags: {}, // 重置剧情标记
      // 重置结局跟踪变量
      highPerfWeeksStreak: 0,
      perfectFishWeeksStreak: 0,
      socialEventCount: 0,
      earlyFinishDaysStreak: 0
    });
    
    // 重置固定事件触发状态
    scriptedEvents.forEach(event => {
      event.triggered = false;
    });
    
    // 重置音频状态
    audioManager.stopBGM();
    audioManager.isFishing = false;
    
    // 回到开始游戏界面
    const app = document.getElementById('app');
    const viewport = document.getElementById('viewport');
    
    // 确保清理任何可能残留的视觉效果
    if(viewport) {
      viewport.style.filter = '';
      viewport.style.transition = '';
    }
    
    // 清理所有UI状态
    const toast = document.getElementById('toast');
    if(toast) {
      toast.classList.add('hidden');
      toast.classList.remove('center');
    }
    
    // 清理模态框状态
    const eventModal = document.getElementById('eventModal');
    const summaryModal = document.getElementById('summaryModal');
    if(eventModal) eventModal.classList.add('hidden');
    if(summaryModal) summaryModal.classList.add('hidden');
    
    // 确保没有事件暂停状态
    state.pausedForEvent = false;
    
    // 清理老板显示状态
    const boss = document.getElementById('boss');
    if(boss) {
      boss.style.display = 'none';
      boss.classList.remove('shake');
    }
    
    // 清理摸鱼面板状态
    const fishPanel = document.getElementById('fishPanel');
    if(fishPanel) {
      fishPanel.classList.add('hidden');
    }
    if(app && viewport) {
      // 恢复开始背景
      viewport.style.setProperty('--bg-image', 'url("img/background/background-start.png")');
      
      app.classList.add('prestart');
      app.classList.remove('started');
      viewport.classList.remove('started');
      
      // 重新创建开始按钮
      const startOverlay = document.createElement('div');
      startOverlay.id = 'startOverlay';
      startOverlay.className = 'start-overlay';
      startOverlay.innerHTML = '<button id="startBtn" class="start-btn">开始游戏</button>';
      app.appendChild(startOverlay);
      
      // 重新绑定开始按钮事件
      const startBtn = document.getElementById('startBtn');
      startBtn?.addEventListener('click', () => {
        const app = document.getElementById('app');
        const viewport = document.getElementById('viewport');
        if(!app || !viewport) return;
        
        // 播放开始游戏音效
        audioManager.playSFX('clicks');
        
        // 切换背景到游戏背景
        viewport.style.setProperty('--bg-image', 'url("img/background/background-01.png.png")');
        
        app.classList.remove('prestart');
        app.classList.add('started');
        viewport.classList.add('started');
        startOverlay?.remove();
        
        // 开始播放BGM
        audioManager.playBGM('bgm01');
        
        render();
      });
    }
    
    render();
    // 允许重新点击键盘
    keyboardBtn?.removeAttribute('disabled');
  }

  // 键盘推动工作（若在摸鱼，则先退出再计入点击）
  let isKeyboardPressed = false;
  // 连续点击检测（用于打字音效）：连续两次以上且间隔较短才播放
  let typingClickCount = 0;
  let lastTypingClickTs = 0;
  let typingSoundActive = false;
  let typingDecayTimerId = null;
  const TYPING_CLICK_WINDOW_MS = 600; // 两次点击间隔阈值（放宽）
  const TYPING_DECAY_MS = 700; // 超过该时间无点击则停止音效（放宽）
  
  keyboardBtn.addEventListener('mousedown', (ev) => {
    // 达成当日工作后仍可点击（仅心情继续结算，绩效显示与结算封顶）
    if(state.isFishing){
      closeFish();
    }
    state.clicksToday += 1;
    
    // 点击音效逻辑：第一次点击播放单次音效，连续点击启动循环音效
    const nowTs = Date.now();
    if (nowTs - lastTypingClickTs <= TYPING_CLICK_WINDOW_MS) {
      typingClickCount += 1;
    } else {
      typingClickCount = 1;
    }
    lastTypingClickTs = nowTs;
    
    if (!typingSoundActive) {
      // 启动键盘音效
      typingSoundActive = true;
      const keyboardAudio = audioManager.audioElements.keyboardClicks;
      keyboardAudio.currentTime = 0;
      keyboardAudio.volume = 0.8;
      keyboardAudio.loop = (typingClickCount >= 2); // 连续点击时循环，单次点击不循环
      keyboardAudio.play().catch(e => console.log('键盘音效播放失败:', e));
    } else if (typingClickCount >= 2) {
      // 如果已经在播放但现在变成连续点击，启用循环
      const keyboardAudio = audioManager.audioElements.keyboardClicks;
      if (!keyboardAudio.loop) {
        keyboardAudio.loop = true;
        keyboardAudio.currentTime = 0; // 重新开始以确保循环效果
      }
    }
    // 续命：只要持续快速点击就保持音效；否则在衰减时间后停止
    if (typingDecayTimerId) { clearTimeout(typingDecayTimerId); }
    typingDecayTimerId = setTimeout(() => {
      if (typingSoundActive) {
        typingSoundActive = false;
        audioManager.audioElements.keyboardClicks.pause();
        audioManager.audioElements.keyboardClicks.currentTime = 0;
        audioManager.audioElements.keyboardClicks.loop = false;
        audioManager.audioElements.keyboardClicks.volume = 0.3; // 恢复默认音量
      }
      typingClickCount = 0;
    }, TYPING_DECAY_MS);
    
    // 每16次-3心情（相当于每完成4%工作降低3点心情）
    if(state.clicksToday % 16 === 0){
      state.mood = clamp(state.mood - 3, 0, 100);
      if(state.mood < 60){
        // 居中提示 + 心情UI抖动；移除屏幕抖动
        showCenterToast('心情值过低，需要休息一下', 'mood');
        shakeMoodUI();
        
        // 摸鱼按钮抖动并放大动画
        if (fishToggle) {
          fishToggle.classList.add('fish-shake');
          // 动画结束后移除类
          setTimeout(() => {
            fishToggle.classList.remove('fish-shake');
          }, 800);
        }
      }
      if(state.mood < 50){ return badEnd('不吃草的马儿（心情过低）'); }
    }

    // 达成工作目标，提示一次
    if(!state.workDoneNotified && state.clicksToday >= WORK_TARGET_CLICKS){
      state.workDoneNotified = true;
      showCenterToast('恭喜！今日工作目标已完成', 'success');
      // 不再禁用键盘；继续允许点击，但绩效封顶
    }
    render();
  });
  
  // 键盘松开时停止播放音效
  keyboardBtn.addEventListener('mouseup', () => {
    if (isKeyboardPressed) { isKeyboardPressed = false; }
    // 不立刻停止音效，交由衰减计时器处理；这样连续点击能保持打字声
    // 若需要立刻停止，可将逻辑调整回立即pause
  });
  
  // 鼠标离开键盘区域时也停止播放音效
  keyboardBtn.addEventListener('mouseleave', () => {
    if (isKeyboardPressed) { isKeyboardPressed = false; }
    if (typingSoundActive) {
      typingSoundActive = false;
      audioManager.audioElements.keyboardClicks.pause();
      audioManager.audioElements.keyboardClicks.currentTime = 0;
      audioManager.audioElements.keyboardClicks.loop = false;
      audioManager.audioElements.keyboardClicks.volume = 0.3;
    }
    typingClickCount = 0;
    if (typingDecayTimerId) { clearTimeout(typingDecayTimerId); typingDecayTimerId = null; }
  });

  function openFish(){ 
    state.isFishing = true; 
    state.lockEventOrBoss = false; 
    
    // 开始摸鱼BGM
    audioManager.startFishingBGM();
    render(); 
  }
  function closeFish(){
    state.isFishing = false; 
    // 停止摸鱼BGM，回到正常BGM
    audioManager.stopFishingBGM();
    render();
    if(state.bossActiveWindowId){ clearTimeout(state.bossActiveWindowId); state.bossActiveWindowId = null; }
    state.bossVisible = false; bossEl.classList.remove('shake');
    
    // 停止播放老板音效
    if(audioManager.audioElements.bossbgm01) {
      audioManager.audioElements.bossbgm01.pause();
      audioManager.audioElements.bossbgm01.currentTime = 0;
    }
    
    // 关闭时重置摸鱼计时器
    state.fishAccumSec = 0; state.bossAccumSec = 0;
  }
  fishToggle.addEventListener('click', openFish);
  fishClose.addEventListener('click', closeFish);

  // 老板机制：摸鱼时每累积6秒判定一次，60%概率出现
  function triggerBoss(){
    if(!state.isFishing) return;
    if(state.pausedForEvent) return; // 事件期间不触发老板
    if(state.bossVisible) return;
    if(state.lockEventOrBoss) return; // 与随机事件互斥
    // 60% 概率出现老板（每6秒判定一次）
    if(Math.random() < 0.4) return;
    
    // 第3天开始，随机使用两个Boss形象之一，并记录变体
    try {
      const bossChoices = (state.day >= 3)
        ? ['img/ui/ui-boss.png', 'img/ui/ui-boss-01.png']
        : ['img/ui/ui-boss.png'];
      const chosen = bossChoices[Math.floor(Math.random()*bossChoices.length)];
      state.currentBossVariant = (chosen.indexOf('ui-boss-01') !== -1) ? 'boss01' : 'boss';
      bossEl.style.backgroundImage = `url('${chosen}')`;
    } catch(_) { state.currentBossVariant = 'boss'; }
    
    state.bossVisible = true; 
    state.lockEventOrBoss = true; // 锁定，防止随机事件同时出现
    
    // 给摸鱼关闭按钮添加抖动动画，增加点击难度
    if (fishClose && state.isFishing) {
      console.log('Adding boss-shake animation to fishClose button');
      fishClose.classList.add('boss-shake');
      
      // 从第二天开始，添加更大幅度的抖动
      if (state.day >= 2) {
        fishClose.classList.add('day2-plus');
        console.log('Added day2-plus class for enhanced shake');
      }
      
      // 动画结束后移除类
      setTimeout(() => {
        console.log('Removing boss-shake animation from fishClose button');
        fishClose.classList.remove('boss-shake');
        fishClose.classList.remove('day2-plus');
      }, 2000);
    } else {
      console.log('fishClose not found or not fishing:', { fishClose: !!fishClose, isFishing: state.isFishing });
    }
    
    // 暂时降低摸鱼BGM音量
    if(audioManager.currentBGM && audioManager.audioElements[audioManager.currentBGM]) {
      audioManager.audioElements[audioManager.currentBGM].volume = 0.1; // 降低到10%
    }
    
    // 播放老板出现音效（根据boss类型选择不同音效）
    try {
      const bossSfxKey = (state.currentBossVariant === 'boss01') ? 'bossbgm03' : 'bossbgm01';
      const bossSfx = audioManager.audioElements[bossSfxKey];
      if(bossSfx){
        bossSfx.loop = false;
      }
      audioManager.playSFX(bossSfxKey, 0.8); // 80%音量
    } catch(_) {
      // 如果bossbgm03不存在，回退到bossbgm01
      audioManager.playSFX('bossbgm01', 0.8);
    }
    
    render();
    // 计算周数：1-5为第1周，8-12为第2周，15-19为第3周...
    const weekNumber = state.day <= 5 ? 1 : Math.floor((state.day - 1) / 7) + 1;
    
    // 反应窗口时间计算
    let windowMs;
    if (weekNumber >= 2) {
      // 第二周开始：ui-boss-01为0.8秒，ui-boss为1.5秒
      windowMs = (state.currentBossVariant === 'boss01') ? 800 : 1500;
    } else {
      // 第一周：ui-boss-01为1秒，ui-boss为3秒
      windowMs = (state.currentBossVariant === 'boss01') ? 1000 : 3000;
    }
    
    if(state.bossActiveWindowId){ clearTimeout(state.bossActiveWindowId); }
    state.bossActiveWindowId = setTimeout(() => {
      // 未在窗口内关闭摸鱼则判定为被抓
      if(state.isFishing){
        state.dailyPenaltyPerf += 1;
        state.dailyCaught += 1; state.weeklyCaught += 1;
        bossEl.classList.add('shake'); showToast('摸鱼被抓，绩效-1', 'warning');
        if(state.dailyCaught >= 3) return badEnd('再也不用摸鱼了（当日被抓≥3）');
        if(state.weeklyCaught >= 5) return badEnd('再也不用摸鱼了（本周被抓≥5）');
      }
      setTimeout(() => { 
        bossEl.classList.remove('shake'); 
        state.bossVisible = false; 
        
        // 停止播放老板音效（确保不再继续）
        const bossSfxKey = (state.currentBossVariant === 'boss01') ? 'bossbgm03' : 'bossbgm01';
        if(audioManager.audioElements[bossSfxKey]) {
          audioManager.audioElements[bossSfxKey].pause();
          audioManager.audioElements[bossSfxKey].currentTime = 0;
          audioManager.audioElements[bossSfxKey].loop = false;
        }
        
        // 恢复摸鱼BGM音量
        if(audioManager.currentBGM && audioManager.audioElements[audioManager.currentBGM]) {
          audioManager.audioElements[audioManager.currentBGM].volume = 0.3; // 恢复到30%
        }
        state.lockEventOrBoss = false; // 解锁，允许随机事件再次出现
        render(); 
      }, 1000);
    }, windowMs);
  }

  // 随机事件（与老板互斥，每40秒触发一次；前1分钟不出现；之后每40秒60%概率）
  function maybeEvent(fortySecondTick){
    if(state.gameEnded) return; // 游戏已结束，不再触发随机事件
    if(state.dayEnded) return; // 当日已结算，不再触发随机事件
    if(state.lockEventOrBoss) return;
    if(state.lastEventMinute === fortySecondTick) return; // 本40秒已触发或判定
    if(fortySecondTick === 0) return; // 前40秒不出现（第一分钟）
    if(Math.random() < 0.6){ // 提高触发概率从50%到60%
      // 严格限制：只选择当天未触发的事件
      const availableEvents = events.filter(event => 
        !state.dailyTriggeredEvents.includes(event.id)
      );
      
      // 如果没有可用事件，跳过（不允许重复）
      if(availableEvents.length === 0) return;
      
      state.lockEventOrBoss = true;
      state.lastEventMinute = fortySecondTick;
      
      // 播放随机事件音效
      audioManager.playSFX('randomEvents');
      
      const ev = availableEvents[Math.floor(Math.random() * availableEvents.length)];
      // 记录已触发的事件（严格限制，所有事件都记录）
      state.dailyTriggeredEvents.push(ev.id);
      
      eventTitle.textContent = ev.title; eventDesc.textContent = ev.desc;
      function applyOutcome(o){
        state.mood = clamp(state.mood + (o.mood||0), 0, 100);
        let moneyChange = (o.money||0);
        
        // 处理彩票特殊逻辑
        if (o.special === 'lottery') {
          const random = Math.random();
          let lotteryWin = 0;
          let resultMessage = '';
          
          if (random < 0.0001) { // 0.01% 概率
            lotteryWin = 10000;
            resultMessage = '🎉 恭喜！中了大奖10000元！发财了！';
          } else if (random < 0.0001 + 0.05) { // 5% 概率
            lotteryWin = 100;
            resultMessage = '🎊 运气不错！中了100元小奖！';
          } else if (random < 0.0001 + 0.05 + 0.20) { // 20% 概率
            lotteryWin = 20;
            resultMessage = '😊 中了20元安慰奖！';
          } else {
            // 74.9999% 概率什么也不中
            resultMessage = '😔 很遗憾，没有中奖...';
          }
          
          moneyChange += lotteryWin;
          
          // 显示彩票结果
          setTimeout(() => {
            showCenterToast(resultMessage, lotteryWin > 0 ? 'success' : 'info', '买了彩票');
          }, 500);
        }
        
        state.money += moneyChange;
        
        // 处理绩效变化
        if (o.perf) {
          if (o.perf > 0) {
            // 正绩效加到额外绩效
            state.weeklyExtraPerf += o.perf;
          } else {
            // 负绩效直接扣除当日绩效
            state.dailyPenaltyPerf += Math.abs(o.perf);
            console.log(`随机事件扣除绩效: ${Math.abs(o.perf)}点，当日累计扣除: ${state.dailyPenaltyPerf}点`);
          }
        }
        
        // 处理关系值变化
        if (o.relationship) {
          state.relationship = clamp(state.relationship + o.relationship, 0, 100);
        }
        
        // 跟踪花费（负数表示花费，但不包括彩票奖金）
        const originalExpense = (o.money||0);
        if (originalExpense < 0) {
          const expense = Math.abs(originalExpense);
          state.dailyEventExpenses += expense;
          state.weeklyEventExpenses += expense;
          console.log(`第${state.day}天随机事件花费: ${expense}元，累计: ${state.dailyEventExpenses}元`);
        }
        
        // 事件结束，恢复计时和解锁事件系统
        state.pausedForEvent = false;
        state.lockEventOrBoss = false;
        closeModal(); render();
      }
      opt1.textContent = ev.a.label; opt2.textContent = ev.b.label;
      opt1.onclick = () => {
        applyOutcome(ev.a);
        // 跟踪社交事件参与（积极选择）
        if (((ev.id === 'colleague_birthday' || ev.id === 'team_building') && ev.a.relationship > 0)) {
          state.socialEventCount += 1;
        }
      };
      opt2.onclick = () => {
        applyOutcome(ev.b);
        // 跟踪社交事件参与（积极选择）
        if (((ev.id === 'colleague_birthday' || ev.id === 'team_building') && ev.b.relationship > 0)) {
          state.socialEventCount += 1;
        }
      };
      // 打开事件时暂停计时与摸鱼/老板
      state.pausedForEvent = true;
      openModal();
    }
  }

  function openModal(){ modal.classList.remove('hidden'); }
  function closeModal(){ modal.classList.add('hidden'); }

  // 固定事件检查函数
  function checkScriptedEvents(){
    if(state.gameEnded) return;
    if(state.dayEnded) return;
    if(state.lockEventOrBoss) return;
    
    // 第一天的前1分钟（现实时间）不触发固定事件
    if(state.day === 1){
      const elapsedSeconds = ONE_DAY_SECONDS - state.secondsLeft;
      if(elapsedSeconds < 60) return; // 前60秒不触发固定事件
    }
    
    // 收集当天所有可以触发的事件
    const availableEvents = [];
    for(let event of scriptedEvents){
      // 检查是否已触发过
      if(event.triggered) continue;
      
      // 检查天数条件
      if(event.day && event.day !== state.day) continue;
      
      // 检查其他条件
      if(event.condition){
        if(event.condition.type === 'relationship' && state.relationship < event.condition.value){
          continue;
        }
        if(event.condition.type === 'flag'){
          const flagValue = state.storyFlags[event.condition.flag];
          if(flagValue !== event.condition.value){
            continue;
          }
        }
        // 可以添加更多条件类型
      }
      
      availableEvents.push(event);
    }
    
    // 如果有可用事件，随机选择一个触发
    if(availableEvents.length > 0){
      // 随机选择一个事件触发
      const randomIndex = Math.floor(Math.random() * availableEvents.length);
      const selectedEvent = availableEvents[randomIndex];
      
      // 触发选中的事件
      selectedEvent.triggered = true;
      state.lockEventOrBoss = true;
      
      // 播放随机事件音效
      audioManager.playSFX('randomEvents');
      
      eventTitle.textContent = selectedEvent.title;
      eventDesc.textContent = selectedEvent.desc;
      opt1.textContent = selectedEvent.a.label;
      opt2.textContent = selectedEvent.b.label;
      opt2.style.display = ''; // 确保显示第二个选项
      
      function applyScriptedOutcome(o, eventFlags, choiceType){
        state.mood = clamp(state.mood + (o.mood||0), 0, 100);
        const moneyChange = (o.money||0);
        state.money += moneyChange;
        
        // 处理绩效变化
        if (o.perf) {
          if (o.perf > 0) {
            // 正绩效加到额外绩效
            state.weeklyExtraPerf += o.perf;
          } else {
            // 负绩效直接扣除当日绩效
            state.dailyPenaltyPerf += Math.abs(o.perf);
            console.log(`固定事件扣除绩效: ${Math.abs(o.perf)}点，当日累计扣除: ${state.dailyPenaltyPerf}点`);
          }
        }
        
        // 处理关系值变化
        if (o.relationship) {
          state.relationship = clamp(state.relationship + o.relationship, 0, 100);
        }
        
        // 跟踪花费（负数表示花费）
        if (moneyChange < 0) {
          const expense = Math.abs(moneyChange);
          state.dailyEventExpenses += expense;
          state.weeklyEventExpenses += expense;
          console.log(`第${state.day}天固定事件花费: ${expense}元，累计: ${state.dailyEventExpenses}元`);
        }
        
        // 处理剧情标记
        if(eventFlags){
          for(let flagKey in eventFlags){
            if(eventFlags[flagKey] === choiceType || eventFlags[flagKey] === 'A_or_B'){
              state.storyFlags[flagKey] = choiceType;
            }
          }
        }
        
        // 事件结束，恢复计时和解锁事件系统
        state.pausedForEvent = false;
        state.lockEventOrBoss = false;
        closeModal(); render();
      }

      opt1.onclick = () => {
        // 跟踪社交事件参与（在应用结果之前）
        if (selectedEvent.id === 'DAY4_XIAOYA_LUNCH' && selectedEvent.a.relationship > 0) {
          state.socialEventCount += 1;
        }
        applyScriptedOutcome(selectedEvent.a, selectedEvent.flags, 'A');
      };
      opt2.onclick = () => {
        // 跟踪社交事件参与（在应用结果之前）
        if (selectedEvent.id === 'DAY4_XIAOYA_LUNCH' && selectedEvent.b.relationship > 0) {
          state.socialEventCount += 1;
        }
        applyScriptedOutcome(selectedEvent.b, selectedEvent.flags, 'B');
      };
      
      // 打开事件时暂停计时
      state.pausedForEvent = true;
      openModal();
    }
  }

  // 关系值事件：当关系值低于40时触发举报事件
  function checkRelationshipEvents(){
    if(state.gameEnded) return;
    if(state.dayEnded) return;
    if(state.lockEventOrBoss) return;
    if(state.relationshipEventTriggered) return; // 已触发过
    
    if(state.relationship < 40){
      state.relationshipEventTriggered = true;
      state.lockEventOrBoss = true;
      
      // 播放随机事件音效
      audioManager.playSFX('randomEvents');
      
      // 暂停游戏时间
      state.pausedForEvent = true;
      
      eventTitle.textContent = '匿名举报';
      eventDesc.textContent = '有人偷偷举报你摸鱼，HR找你谈话了...';
      opt1.textContent = '知道了';
      opt2.textContent = ''; // 隐藏第二个选项
      opt2.style.display = 'none';
      
      opt1.onclick = () => {
        // 绩效-5
        state.dailyPenaltyPerf += 5;
        showToast('绩效-5，要注意同事关系！', 'warning');
        opt2.style.display = ''; // 恢复第二个选项显示
        state.pausedForEvent = false; // 恢复游戏时间
        closeModal(); 
        state.lockEventOrBoss = false; 
        render();
      };
      
      openModal();
    }
  }

  // 计时循环：每秒一次，按分钟点触发事件；摸鱼时累计心情与老板判定
  const tick = () => {
    if(state.gameEnded) return; // 游戏已结束，停止所有计时
    if(state.dayEnded) {
      // 添加调试信息
      if(state.day > 1 && state.secondsLeft > 0) {
        console.log(`第${state.day}天计时器被dayEnded阻止，dayEnded=${state.dayEnded}, secondsLeft=${state.secondsLeft}`);
      }
      return; // 已结算则暂停计时
    }
    if(document.getElementById('app')?.classList.contains('prestart')) return; // 未开始不计时
    if(state.pausedForEvent) return; // 事件期间暂停计时/摸鱼/老板
    state.secondsLeft -= 1;
    if(state.isFishing) {
      // 摸鱼每2秒 +1 心情
      state.fishAccumSec += 1; state.bossAccumSec += 1;
      if(state.fishAccumSec >= 2){ state.fishAccumSec -= 2; state.mood = clamp(state.mood + 1, 0, 100); }
      if(state.bossAccumSec >= 6){ state.bossAccumSec -= 6; triggerBoss(); }
    }

    const fortySecondTick = Math.floor((ONE_DAY_SECONDS - state.secondsLeft) / 40);
    if(fortySecondTick !== state.lastMinuteMark){
      state.lastMinuteMark = fortySecondTick;
      state.lockEventOrBoss = false; // 新的40秒可以再次判定
      if(!state.lockEventOrBoss) maybeEvent(fortySecondTick);
    }

    // 每30秒检查一次固定事件（随机时间触发）
    const thirtySecondTick = Math.floor((ONE_DAY_SECONDS - state.secondsLeft) / 30);
    if(thirtySecondTick !== state.lastScriptedEventCheck && Math.random() < 0.3){
      state.lastScriptedEventCheck = thirtySecondTick;
      if(!state.lockEventOrBoss) checkScriptedEvents();
    }
    
    // 检查关系值事件
    if(!state.lockEventOrBoss) checkRelationshipEvents();

    if(state.secondsLeft <= 0){ state.secondsLeft = 0; endOfDay(); }
    render();
  };
  setInterval(tick, 1000);

  // 开始游戏
  startBtn?.addEventListener('click', () => {
    const app = document.getElementById('app');
    const viewport = document.getElementById('viewport');
    if(!app || !viewport) return;
    
    // 播放开始游戏音效
    audioManager.playSFX('clicks');
    
    // 切换背景到游戏背景
    viewport.style.setProperty('--bg-image', 'url("img/background/background-01.png.png")');
    
    app.classList.remove('prestart');
    app.classList.add('started');
    viewport.classList.add('started'); // 让背景伪元素应用模糊
    startOverlay?.remove();
    
    // 开始播放BGM
    audioManager.playBGM('bgm01');
    
    render();
  });

  render();
})();

// 启动资源预加载
document.addEventListener('DOMContentLoaded', () => {
  resourceLoader.init();
});


