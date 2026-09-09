'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Check, Copy, Download, ExternalLink, Mail, Phone, RotateCw, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeskScene, type DeskPanel, type PersonalStuffId, type PersonalStuffOrigin } from '@/components/desk-scene';

gsap.registerPlugin(useGSAP);

type Panel = DeskPanel;
type PhotoView = 'index' | 'portrait' | 'street' | `series:${number}`;
type DesignView = 'index' | 'zine' | 'campaign' | 'internship';
type PlanningView = 'index' | 'deqing' | 'nestle';

const latestPortraitAsset = (path: string) => `${path}?v=20260906-source-sync-3`;
const portraitEntryCover = '/portfolio/photography/portrait-entry-cover-20260906.jpg';

const portraitSeries = [
  {
    title: 'Before the Light Fades',
    cover: latestPortraitAsset('/portfolio/photography/portraits/before-the-light-fades/cover.jpg'),
    images: ['01', '02', '03', '04', '05', '06', '07'].map((name) => latestPortraitAsset(`/portfolio/photography/portraits/before-the-light-fades/${name}.jpg`)),
  },
  {
    title: 'Beyond the Valley',
    cover: '/portfolio/photography/portraits/beyond-the-valley/cover.jpg',
    images: ['01.jpg', '02.jpg', '03.jpg', '04.JPG', '05.jpg'].map((name) => `/portfolio/photography/portraits/beyond-the-valley/${name}`),
  },
  {
    title: 'A Slow Afternoon',
    cover: latestPortraitAsset('/portfolio/photography/portraits/a-slow-afternoon/cover.JPG'),
    images: ['01', '02', '03', '04', '05', '06'].map((name) => latestPortraitAsset(`/portfolio/photography/portraits/a-slow-afternoon/${name}.JPG`)),
  },
  {
    title: 'After Closing',
    cover: '/portfolio/photography/portraits/after-closing/cover.jpg',
    images: ['03', '01', '06', '02', '04', '05'].map((name) => `/portfolio/photography/portraits/after-closing/${name}.jpg`),
  },
  {
    title: 'Exercises in Weightlessness',
    cover: '/portfolio/photography/portraits/exercises-in-weightlessness/cover.jpg',
    images: ['01', '04', '02', '05', '03', '06'].map((name) => `/portfolio/photography/portraits/exercises-in-weightlessness/${name}.jpg`),
  },
];

const streetPhotos = ['01', '04', '02', '07', '03', '08', '05', '09', '06', '10']
  .map((name) => `/portfolio/photography/observations/${name}.JPG`);

const videos = [
  {
    title: 'TVC《不只活力》',
    note: '以年轻人的活力状态为切口，通过快节奏剪辑与人物舞动，呈现景田矿泉水「释放活力」的品牌表达。',
    details: ['视频策划 · 拍摄 · 剪辑', '2023 全国学院奖优秀奖'],
    cover: '/portfolio/video/video-01/cover.png',
    src: '/portfolio/video/video-01/full.mp4',
    fullUrl: null,
  },
  {
    title: 'TVC《刻画新规则》',
    note: '以「反转」为核心创意，用语言与画面的预期差突出产品优势，并通过一镜到底强化广告记忆点。',
    details: ['剪辑 · 出镜', '第十五届大广赛省级优秀奖'],
    cover: '/portfolio/video/video-02/cover.jpg',
    src: '/portfolio/video/video-02/full.mp4',
    fullUrl: null,
  },
  {
    title: 'TVC《拒绝卡顿》',
    note: '以三段式幽默情境类比「信号不卡顿」的产品利益点，用轻量剧情将抽象通信卖点转化为直观记忆。',
    details: ['策划 · 剪辑', '第十五届大广赛国家级三等奖'],
    cover: '/portfolio/video/video-03/cover.png',
    src: '/portfolio/video/video-03/full.mp4',
    fullUrl: null,
  },
  {
    title: '微纪录片《百年短暂，滋味悠长》',
    note: '以武汉豆皮店为观察切口，通过人物采访与市井影像记录过早文化，呈现城市日常背后的生活温度。',
    details: ['脚本 · 拍摄 · 剪辑', '城市文化微纪录片'],
    cover: '/portfolio/video/video-04/cover.png',
    src: '/portfolio/video/video-04/full.mp4',
    fullUrl: 'https://my.feishu.cn/record/A614rkOeDen0WjcyJSucuvYInRb',
  },
  {
    title: '旅行影像《九月烟台》',
    note: '记录与朋友在烟台的四日旅行，以日常观察与碎片化影像保存一段轻盈、私人的旅行记忆。',
    details: ['共同策划 · 共同拍摄 · 剪辑', '个人旅行影像 / 非商业创作'],
    cover: '/portfolio/video/video-05/cover.png',
    src: '/portfolio/video/video-05/full.mp4',
    fullUrl: null,
  },
];

const panels: Record<
  Exclude<Panel, 'photo' | 'video'>,
  { eyebrow: string; title: string; description: string; images?: string[] }
> = {
  design: {
    eyebrow: 'DESIGN INDEX / 03',
    title: 'Graphic works',
    description: 'Posters, zines, and visual ideas made along the way.',
  },
  planning: {
    eyebrow: 'PROJECT FILES / 04',
    title: 'Notes for possible ideas',
    description: 'Selected proposals, concepts, and planning sketches.',
  },
  polaroid: {
    eyebrow: 'A SMALL INTRODUCTION',
    title: 'Hi, I’m Jiayan.',
    description:
      'Interested in almost everything, attached to nothing for too long. I take photos, make things, collect beautiful cards, and call myself artistic type A.',
  },
  badge: {
    eyebrow: 'CONTACT CARD',
    title: '莫嘉琰 / Jiayan Mo',
    description: 'Phone · 191 6867 7856\nEmail · jiayanmomo@qq.com',
  },
};

const zineImages = Array.from({ length: 11 }, (_, index) =>
  `/portfolio/design/01-zine/${String(index + 1).padStart(2, '0')}.jpg`,
);

const campaignModules = [
  {
    id: 'visual-identity',
    number: '01',
    title: 'Visual Identity',
    description: '以「贡小柑」为核心角色，建立年轻、亲切的 Campaign 视觉识别。',
    images: ['/portfolio/design/02-deqing-gonggan-campaign/01-visual-identity/01-ip-character.png'],
  },
  {
    id: 'packaging-system',
    number: '02',
    title: 'Packaging System',
    description: '以青、黄、橙三阶段果期为色彩线索，形成系列化包装系统。',
    images: ['/portfolio/design/02-deqing-gonggan-campaign/02-packaging-system/01-packaging-series.png'],
  },
  {
    id: 'campaign-visuals',
    number: '03',
    title: 'Campaign Visuals',
    description: '围绕产品卖点与「贡柑小镇」概念发展两组系列传播海报。',
    images: [
      '/portfolio/design/02-deqing-gonggan-campaign/03-campaign-visuals/02-product-benefit-series.png',
      '/portfolio/design/02-deqing-gonggan-campaign/03-campaign-visuals/03-citrus-town-series.png',
    ],
  },
  {
    id: 'character-applications',
    number: '04',
    title: 'Character Applications',
    description: '将 IP 延展至饮品、零售陈列与文具等不同消费触点。',
    images: ['/portfolio/design/02-deqing-gonggan-campaign/04-character-applications/01-collage.png'],
  },
  {
    id: 'place-and-experience',
    number: '05',
    title: 'Place & Experience',
    description: '将 Campaign 延伸至 City Drive、街道视觉与线下文旅体验。',
    images: ['/portfolio/design/02-deqing-gonggan-campaign/05-place-and-experience/01-collage.png'],
  },
];

const planningProjects = {
  deqing: {
    number: '01',
    eyebrow: 'BRAND CAMPAIGN · 2023',
    title: '享于乐，贡于心',
    englishTitle: 'Deqing Gonggan Campaign',
    description: '为 2023 中天华南杯广告模拟竞标比赛完成的农产品品牌焕新与市场推广方案。围绕德庆贡柑的品牌认知与在地旅游议题，构建从核心概念、年轻化传播到线下体验的分阶段营销路径。',
    cover: '/portfolio/planning/deqing/case-study-page-1.jpg',
    sourceCount: '56-PAGE FULL PROPOSAL',
    download: '/portfolio/planning/deqing/source.pdf',
    role: '小组负责人 · 核心策划 · 物料设计 · 汇报呈现',
    awards: ['BEST PLANNING AWARD', 'GOVERNMENT NOMINATION AWARD', 'BEST COPYWRITING AWARD'],
    recognition: '方案获得德庆县政府提案采纳意向。',
    accent: 'citrus',
    chapters: [
      { number: '01', title: 'Market Challenge', note: '梳理产品优势、品牌短板与市场机会，明确差异化认知是首要命题。', image: '/portfolio/planning/deqing/case-study-page-3.jpg' },
      { number: '02', title: 'Consumer Insight', note: '从年轻尝鲜与品质礼赠两类人群出发，定位不同消费场景中的真实诉求。', image: '/portfolio/planning/deqing/case-study-page-4.jpg' },
      { number: '03', title: 'Core Concept', note: '将“享”置于“贡”之前，把历史文化转译成当代体验与情绪价值。', image: '/portfolio/planning/deqing/case-study-page-5.jpg' },
      { number: '04', title: 'Visual Refresh', note: '以“贡小柑”IP与系列包装建立更亲切、年轻的品牌表达。', image: '/portfolio/planning/deqing/case-study-page-6.jpg' },
      { number: '05', title: 'Warm-up', note: '通过品牌故事、系列海报与产地科普完成第一阶段认知建立。', image: '/portfolio/planning/deqing/case-study-page-7.jpg' },
      { number: '06', title: 'Heat-up', note: '借助博主矩阵、IP 联名与表情包玩法扩大声量，激发 UGC 互动。', image: '/portfolio/planning/deqing/case-study-page-8.jpg' },
      { number: '07', title: 'Offline Activation', note: '连接饮品共创、小程序足迹、主题小镇与城市路线，推动体验和转化。', image: '/portfolio/planning/deqing/case-study-page-9.jpg' },
      { number: '08', title: 'Retention', note: '以礼物故事征集与长期内容输出回到品牌情感价值。', image: '/portfolio/planning/deqing/case-study-page-10.jpg' },
      { number: '09', title: 'Full-cycle Overview', note: '用四阶段传播链路串联品牌塑造、热度扩散、本地引流与情感沉淀。', image: '/portfolio/planning/deqing/case-study-page-11.jpg' },
    ],
  },
  nestle: {
    number: '02',
    eyebrow: 'SUSTAINABILITY STRATEGY · 2023',
    title: '绿舟计划',
    englishTitle: 'Nestlé Green Ark Plan',
    description: '以高校软塑包装回收为切口，通过用户调研、激励机制、虚拟社区与线下回收触点，建立一条可持续的参与路径。',
    cover: '/portfolio/planning/nestle/page-1.jpg',
    sourceCount: '42 SOURCE PAGES',
    download: '/portfolio/planning/nestle/source.pdf',
    role: null,
    awards: [],
    recognition: null,
    accent: 'green',
    chapters: [
      { number: '01', title: 'Context', note: '从软塑包装的现实回收困境，明确品牌可介入的议题。', image: '/portfolio/planning/nestle/page-4.jpg' },
      { number: '02', title: 'Research Insight', note: '428 份高校调研样本揭示：奖励有效，但参与仍需要更强的趣味与社交动机。', image: '/portfolio/planning/nestle/page-9.jpg' },
      { number: '03', title: 'The Action Gap', note: '环保认知并不自动转化为回收行动，方案需要降低门槛并持续反馈。', image: '/portfolio/planning/nestle/page-10.jpg' },
      { number: '04', title: 'System Proposal', note: '将智能回收站与线上社区连接，形成线下行动、线上留存的双向系统。', image: '/portfolio/planning/nestle/page-11.jpg' },
      { number: '05', title: 'Execution Framework', note: '从宣传、反馈、互动、便利与教育五个维度拆解执行。', image: '/portfolio/planning/nestle/page-16.jpg' },
      { number: '06', title: 'Feedback Mechanism', note: '用明确奖励回应真实需求，让环保行为获得即时正反馈。', image: '/portfolio/planning/nestle/page-18.jpg' },
      { number: '07', title: 'Traceability', note: '以回收提醒、废物流向与校园共建，让参与结果可见。', image: '/portfolio/planning/nestle/page-22.jpg' },
      { number: '08', title: 'Offline Activation', note: '通过环保再造工作坊，让回收从任务转变为可体验、可分享的事件。', image: '/portfolio/planning/nestle/page-30.jpg' },
    ],
  },
} as const;

type PersonalStuffItem = {
  id: PersonalStuffId;
  src: string;
  note: string;
  kind: 'ticket' | 'earpods' | 'pick' | 'photo' | 'souvenir' | 'medal';
  backSrc?: string;
  ribbonSrc?: string;
};

const personalStuffItems: PersonalStuffItem[] = [
  { id: 'movie-ticket', src: '/portfolio/personal-stuff/objects/movie-ticket.png', note: '喜歡的電影', kind: 'ticket' },
  { id: 'earpods', src: '/portfolio/personal-stuff/objects/earpods.png', note: '最近loop的一首：《Day Off》', kind: 'earpods' },
  { id: 'guitar-pick', src: '/portfolio/personal-stuff/objects/guitar-pick.png', note: '一枚吉他拨片', kind: 'pick' },
  { id: 'macau-bungee', src: '/portfolio/personal-stuff/objects/macau-bungee.png', note: '233米的Bungee jump，我做过最勇敢的事', kind: 'souvenir' },
  { id: 'medal', src: '/portfolio/personal-stuff/objects/medal-front.png?v=20260908', backSrc: '/portfolio/personal-stuff/objects/medal-back.png?v=20260908', ribbonSrc: '/portfolio/personal-stuff/objects/medal-ribbon.png?v=20260908', note: '中学生涯唯一一枚校运会奖牌', kind: 'medal' },
  { id: 'photo', src: '/portfolio/personal-stuff/objects/photo.png', note: '一张小时候的照片', kind: 'photo' },
];

function DesignIndex({ onSelect }: { onSelect: (view: DesignView) => void }) {
  return (
    <div className="design-index panel-reveal" aria-label="Graphic works categories">
      <button className="design-entry design-entry-zine" type="button" aria-label="Open ZINE works" onClick={() => onSelect('zine')}>
        <span className="design-entry-copy">
          <small>01 / PRINTED MATTER</small>
          <b>ZINE<br />五月的川西</b>
          <em>open the pages ↗</em>
        </span>
        <span className="zine-stack" aria-hidden="true">
          <span className="zine-sheet zine-sheet-back">
            <img src="/portfolio/design/01-zine/02.jpg" alt="" />
          </span>
          <span className="zine-sheet zine-sheet-middle">
            <img src="/portfolio/design/01-zine/01.jpg" alt="" />
          </span>
          <span className="zine-sheet zine-sheet-cover">
            <img src="/portfolio/design/01-zine/cover.png" alt="" />
          </span>
        </span>
      </button>

      <button className="design-entry design-entry-campaign" type="button" aria-label="Open Deqing Gonggan campaign" onClick={() => onSelect('campaign')}>
        <span className="design-entry-copy">
          <small>02 / INTEGRATED CAMPAIGN</small>
          <b>DEQING GONGGAN<br />CAMPAIGN</b>
          <em>spread the set ↗</em>
        </span>
        <span className="campaign-stack" aria-hidden="true">
          <span className="campaign-piece campaign-piece-one"><img src="/portfolio/design/02-deqing-gonggan-campaign/cover.jpg" alt="" /></span>
          <span className="campaign-piece campaign-piece-two"><img src="/portfolio/design/02-deqing-gonggan-campaign/02-packaging-system/01-packaging-series.png" alt="" /></span>
          <span className="campaign-piece campaign-piece-three"><img src="/portfolio/design/02-deqing-gonggan-campaign/01-visual-identity/01-ip-character.png" alt="" /></span>
        </span>
      </button>

      <button className="design-entry design-entry-xhs" type="button" aria-label="Open Xiaohongshu internship design works" onClick={() => onSelect('internship')}>
        <span className="design-entry-copy">
          <small>03 / SCREEN-NATIVE</small>
          <b>XIAOHONGSHU<br />DESIGN</b>
          <em>scroll the feed ↗</em>
        </span>
        <span className="xhs-screen" aria-hidden="true">
          <span className="xhs-bar"><i /><i /><i /></span>
          <img className="xhs-entry-cover" src="/portfolio/design/03-xiaohongshu-internship/cover.png" alt="" />
        </span>
      </button>
    </div>
  );
}

function ZineProject({ onBack }: { onBack: () => void }) {
  const projectRef = useRef<HTMLElement>(null);
  const coverRef = useRef<HTMLButtonElement>(null);
  const turnRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [turn, setTurn] = useState<{ from: number; to: number; direction: 1 | -1 } | null>(null);

  useEffect(() => {
    const preloadedPages = zineImages.map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });
    return () => preloadedPages.forEach((image) => { image.src = ''; });
  }, []);

  useGSAP(() => {
    if (!isOpen || !coverRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cover = coverRef.current;

    if (isClosing) {
      gsap.set(cover, {
        autoAlpha: 1,
        rotationY: -178,
        transformOrigin: 'left center',
      });
      gsap.set('.zine-reader-spread', { autoAlpha: 0 });
      gsap.set('.zine-opening-right', { autoAlpha: 1 });
      gsap.set('.zine-book-backing', { autoAlpha: 1, scale: 1 });
      gsap.set('.zine-reader-controls', { autoAlpha: 0, pointerEvents: 'none' });

      gsap.timeline({ defaults: { ease: 'power3.inOut' } })
        .to(cover, {
          rotationY: -90,
          duration: reducedMotion ? 0 : .55,
        })
        .set('.zine-opening-right', { autoAlpha: 0 })
        .set('.zine-book-backing', { autoAlpha: 0 })
        .to(cover, {
          rotationY: 0,
          duration: reducedMotion ? 0 : .5,
        })
        .to('.zine-project-copy', {
          x: 0,
          opacity: 1,
          duration: reducedMotion ? 0 : .35,
        }, '<-.22')
        .call(() => {
          setPageIndex(0);
          setIsClosing(false);
          setIsOpen(false);
        });
      return;
    }

    gsap.set(cover, { autoAlpha: 1, rotationY: 0, transformOrigin: 'left center' });
    gsap.set('.zine-reader-spread', { autoAlpha: 0 });
    gsap.set('.zine-opening-right', { autoAlpha: 0 });
    gsap.set('.zine-book-backing', { autoAlpha: 0 });
    gsap.set('.zine-reader-controls', { autoAlpha: 0, pointerEvents: 'none' });

    gsap.timeline({ defaults: { ease: 'power3.inOut' } })
      .to(coverRef.current, {
        rotationY: -90,
        duration: reducedMotion ? 0 : .5,
      }, 0)
      .to('.zine-project-copy', {
        x: reducedMotion ? 0 : -12,
        opacity: .82,
        duration: reducedMotion ? 0 : .45,
      }, .12)
      .set('.zine-opening-right', { autoAlpha: 1 })
      .set('.zine-book-backing', { autoAlpha: 1, scale: 1 })
      .to(coverRef.current, {
        rotationY: -178,
        duration: reducedMotion ? 0 : .55,
        ease: 'power3.out',
      })
      .set('.zine-reader-spread', { autoAlpha: 1 })
      .set('.zine-opening-right', { autoAlpha: 0 })
      .set(coverRef.current, { autoAlpha: 0 })
      .fromTo('.zine-reader-controls', { y: 10, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        pointerEvents: 'auto',
        duration: reducedMotion ? 0 : .35,
      }, '-=.2');
  }, { scope: projectRef, dependencies: [isOpen, isClosing], revertOnUpdate: true });

  useGSAP(() => {
    if (!turn || !turnRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sheet = turnRef.current;
    gsap.set(sheet, {
      transformOrigin: turn.direction > 0 ? 'left center' : 'right center',
      rotationY: 0,
      zIndex: 4,
    });
    gsap.timeline()
      .to(sheet, {
        rotationY: turn.direction > 0 ? -180 : 180,
        duration: reducedMotion ? 0 : .78,
        ease: 'power3.inOut',
      })
      .call(() => {
        setPageIndex(turn.to);
        setTurn(null);
      });
  }, { scope: projectRef, dependencies: [turn], revertOnUpdate: true });

  const changePage = (direction: 1 | -1) => {
    if (!isOpen || turn || isClosing) return;
    if (direction < 0 && pageIndex === 0) {
      setIsClosing(true);
      return;
    }
    const next = pageIndex + direction;
    if (next < 0 || next >= zineImages.length) return;
    setTurn({ from: pageIndex, to: next, direction });
  };

  const visibleIndex = pageIndex;

  return (
    <article ref={projectRef} className={`design-project design-zine-project panel-reveal ${isOpen ? 'is-reader-open' : ''}`}>
      <button className="archive-back design-project-back" onClick={onBack}>← graphic works</button>
      <header className="zine-project-hero">
        <div className="zine-project-copy">
          <span className="project-index">01 / PERSONAL ZINE · 2024</span>
          <h2>五月的川西</h2>
          <p>将川西旅行中的摄影与片段式记录重新编排，以 ZINE 的形式保存沿途的风景与个人感受。</p>
        </div>
        <div className="zine-reader-shell">
          <div
            className="zine-book"
            onPointerDown={(event) => { dragStartRef.current = event.clientX; }}
            onPointerUp={(event) => {
              if (dragStartRef.current === null) return;
              const distance = event.clientX - dragStartRef.current;
              dragStartRef.current = null;
              if (Math.abs(distance) > 42) changePage(distance < 0 ? 1 : -1);
            }}
          >
            <div className="zine-book-backing" aria-hidden="true" />
            <div className="zine-opening-right" aria-hidden="true"><img src={zineImages[0]} alt="" /></div>
            <div className="zine-reader-spread" aria-live="polite">
              <img src={zineImages[visibleIndex]} alt={`《五月的川西》spread ${String(visibleIndex + 1).padStart(2, '0')}`} />
            </div>
            {turn && (
              <div className={`zine-under-page is-${turn.direction > 0 ? 'next' : 'previous'}`} aria-hidden="true">
                <img src={zineImages[turn.to]} alt="" />
              </div>
            )}
            {turn && (
              <div ref={turnRef} className={`zine-turn-sheet is-${turn.direction > 0 ? 'next' : 'previous'}`}>
                <span className="zine-turn-face zine-turn-front"><img src={zineImages[turn.from]} alt="" /></span>
                <span className="zine-turn-face zine-turn-back"><img src={zineImages[turn.to]} alt="" /></span>
              </div>
            )}
            <button
              ref={coverRef}
              type="button"
              className="zine-cover-flip"
              onClick={() => setIsOpen(true)}
              disabled={isOpen || isClosing}
              aria-label="Open 五月的川西 zine"
            >
              <span className="zine-cover-face zine-cover-front"><img src="/portfolio/design/01-zine/cover.png" alt="《五月的川西》ZINE cover" /></span>
              <span className="zine-cover-face zine-cover-back" aria-hidden="true"><img src={zineImages[0]} alt="" /></span>
              <span className="zine-open-label">open the zine ↗</span>
            </button>
          </div>
          <div className="zine-reader-controls" aria-label="Zine page controls">
            <button type="button" onClick={() => changePage(-1)} disabled={!isOpen || Boolean(turn) || isClosing} aria-label={pageIndex === 0 ? 'Close zine' : 'Previous spread'}>←</button>
            <span>{String(visibleIndex + 1).padStart(2, '0')} / {String(zineImages.length).padStart(2, '0')}</span>
            <button type="button" onClick={() => changePage(1)} disabled={!isOpen || pageIndex === zineImages.length - 1 || Boolean(turn) || isClosing} aria-label="Next spread">→</button>
          </div>
        </div>
      </header>
    </article>
  );
}

function CampaignProject({ onBack }: { onBack: () => void }) {
  const goToModule = (id: string) => document.getElementById(`campaign-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <article className="design-project campaign-project panel-reveal">
      <button className="archive-back design-project-back" onClick={onBack}>← graphic works</button>
      <header className="campaign-overview">
        <div className="campaign-cover-wrap">
          <img src="/portfolio/design/02-deqing-gonggan-campaign/cover.jpg" alt="Deqing Gonggan Campaign key visual" />
          <span>02 / INTEGRATED CAMPAIGN</span>
        </div>
        <div className="campaign-overview-copy">
          <span className="project-index">CAMPAIGN OVERVIEW · 2023</span>
          <h2>德庆贡柑<br /><i>Deqing Gonggan</i></h2>
          <p>以广东德庆贡柑为核心展开的整合 Campaign，通过年轻化的视觉表达重新连接地方农产品、地域文化与消费体验。</p>
          <p>以贡柑 IP 作为连接不同触点的核心视觉角色，将品牌视觉延展至包装、传播物料、IP 应用及线下场景，建立一套连续而轻松的 Campaign 视觉系统。</p>
          <dl>
            <div><dt>ROLE</dt><dd>Campaign 策划 / 视觉设计 / IP 设计 / 包装设计 / 传播物料设计</dd></div>
            <div><dt>TIME</dt><dd>2023.09—2023.12</dd></div>
          </dl>
        </div>
      </header>

      <nav className="campaign-nav" aria-label="Campaign sections">
        {campaignModules.map((module) => (
          <button key={module.id} onClick={() => goToModule(module.id)}><b>{module.number}</b><span>{module.title}</span></button>
        ))}
      </nav>

      <div className="campaign-modules">
        {campaignModules.map((module) => (
          <section className={`campaign-module campaign-module-${module.id}`} id={`campaign-${module.id}`} key={module.id}>
            <header>
              <span>{module.number}</span>
              <div><h3>{module.title}</h3></div>
              <p>{module.description}</p>
            </header>
            <div className={`campaign-module-media media-count-${module.images.length}`}>
              {module.images.map((image, index) => (
                <figure key={image}>
                  <img src={image} alt={`${module.title} visual ${index + 1}`} loading={module.number > '02' ? 'lazy' : 'eager'} />
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

type DesignLightboxState = { images: string[]; index: number; title: string };

const internshipVisuals = {
  selection: [
    '/portfolio/design/03-xiaohongshu-internship/02-campaign-banners/01-series-banner.png',
    '/portfolio/design/03-xiaohongshu-internship/02-campaign-banners/02-series-banner.png',
  ],
  offline: [
    '/portfolio/design/03-xiaohongshu-internship/03-offline-experience/01-womens-day-cafe-screen.jpg',
    '/portfolio/design/03-xiaohongshu-internship/03-offline-experience/02-womens-day-event-banner.png',
  ],
  community: [
    '/portfolio/design/03-xiaohongshu-internship/04-community-events/01-lantern-festival-diy-guide.png',
    '/portfolio/design/03-xiaohongshu-internship/04-community-events/02-jiu-jitsu-event-poster.jpg',
    '/portfolio/design/03-xiaohongshu-internship/04-community-events/03-event-calendar.png',
  ],
};

function DesignLightbox({ state, onClose, onStep }: { state: DesignLightboxState; onClose: () => void; onStep: (direction: number) => void }) {
  return (
    <div className="photo-lightbox design-lightbox" role="dialog" aria-modal="true" aria-label={`${state.title} visual viewer`} onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close enlarged visual">×</button>
      <button className="lightbox-arrow lightbox-prev" onClick={(event) => { event.stopPropagation(); onStep(-1); }} aria-label="Previous visual">←</button>
      <figure className="lightbox-figure" onClick={(event) => event.stopPropagation()}>
        <img src={state.images[state.index]} alt={`${state.title}, enlarged visual ${state.index + 1}`} />
        <figcaption><span>{state.title}</span><span>{String(state.index + 1).padStart(2, '0')} / {String(state.images.length).padStart(2, '0')}</span></figcaption>
      </figure>
      <button className="lightbox-arrow lightbox-next" onClick={(event) => { event.stopPropagation(); onStep(1); }} aria-label="Next visual">→</button>
    </div>
  );
}

function InternshipProject({ onBack }: { onBack: () => void }) {
  const [lightbox, setLightbox] = useState<DesignLightboxState | null>(null);
  const stepLightbox = (direction: number) => setLightbox((current) => current ? {
    ...current,
    index: (current.index + direction + current.images.length) % current.images.length,
  } : current);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null);
      if (event.key === 'ArrowLeft') stepLightbox(-1);
      if (event.key === 'ArrowRight') stepLightbox(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightbox]);

  const visualFigure = (image: string, alt: string, images: string[], title: string) => (
    <figure key={image}>
      <button className="internship-visual-button" type="button" onClick={() => setLightbox({ images, index: images.indexOf(image), title })} aria-label={`Enlarge ${alt}`}>
        <img src={image} alt={alt} />
        <span aria-hidden="true">view ↗</span>
      </button>
    </figure>
  );

  const viewer = lightbox && typeof document !== 'undefined'
    ? createPortal(<DesignLightbox state={lightbox} onClose={() => setLightbox(null)} onStep={stepLightbox} />, document.body)
    : null;

  return (
    <>
    <article className="design-project internship-project panel-reveal">
      <button className="archive-back design-project-back internship-back" onClick={onBack}>← graphic works</button>

      <header className="internship-overview">
        <div className="internship-brandline">
          <span className="project-index">03 / INTERNSHIP VISUAL ARCHIVE</span>
          <span className="xhs-project-logo"><img src="/portfolio/design/03-xiaohongshu-internship/logo.png" alt="Xiaohongshu" /></span>
        </div>
        <div className="internship-title-row">
          <h2>Internship<br /><i>Visual Works</i></h2>
          <p>在小红书品牌文化团队实习期间，参与社区内容与活动的视觉设计，涵盖长图、Banner、咖啡空间及线下活动物料，并根据不同主题与场景进行视觉表达与延展。</p>
        </div>
      </header>

      <div className="internship-archive">
        <section className="internship-section internship-editorial">
          <header><span>01</span><h3>Editorial <b>内容长图</b></h3></header>
          <div className="editorial-ipad-shell">
            <span className="ipad-camera" aria-hidden="true" />
            <span className="ipad-side-button" aria-hidden="true" />
            <div className="editorial-scroll-frame">
              <span>SCROLL THE ARTICLE ↓</span>
              <img src="/portfolio/design/03-xiaohongshu-internship/01-editorial-content/01-saving-jar-article.png" alt="Saving Jar editorial article" />
            </div>
          </div>
        </section>

        <section className="internship-section internship-selection">
          <header><span>02</span><h3>Visual Selection <b>视觉精选</b></h3></header>
          <div className="selection-grid">
            {internshipVisuals.selection.map((image, index) => visualFigure(image, `Xiaohongshu campaign banner selection ${index + 1}`, internshipVisuals.selection, 'Visual Selection'))}
          </div>
        </section>

        <section className="internship-section internship-offline">
          <header><span>03</span><h3>Offline Applications <b>线下应用</b></h3></header>
          <div className="offline-stack">
            {internshipVisuals.offline.map((image, index) => visualFigure(image, index === 0 ? "Women's Day café screen design" : "Women's Day event banner", internshipVisuals.offline, 'Offline Applications'))}
          </div>
        </section>

        <section className="internship-section internship-community">
          <header><span>04</span><h3>Community Events <b>社区活动</b></h3></header>
          <div className="community-grid">
            {internshipVisuals.community.map((image, index) => visualFigure(image, ['Lantern Festival DIY guide', 'Jiu-jitsu community event poster', 'Community event calendar'][index], internshipVisuals.community, 'Community Events'))}
          </div>
        </section>
      </div>
    </article>
    {viewer}
    </>
  );
}

function PlanningIndex({ onSelect }: { onSelect: (view: Exclude<PlanningView, 'index'>) => void }) {
  return (
    <div className="planning-index panel-reveal" aria-label="Planning project files">
      {(Object.keys(planningProjects) as Array<Exclude<PlanningView, 'index'>>).map((key) => {
        const project = planningProjects[key];
        return (
          <button className={`planning-file planning-file-${project.accent}`} type="button" key={key} onClick={() => onSelect(key)}>
            <span className="planning-file-tab">FILE {project.number}</span>
            <span className="planning-file-copy">
              <small>{project.eyebrow}</small>
              <b>{project.englishTitle}</b>
              <em>{project.title}</em>
              <span>{project.sourceCount} · SELECTED CASE</span>
            </span>
            <span className="planning-file-preview" aria-hidden="true">
              <img src={project.cover} alt="" />
            </span>
            <i aria-hidden="true">OPEN FILE ↗</i>
          </button>
        );
      })}
    </div>
  );
}

function PlanningCase({ projectKey, onBack }: { projectKey: Exclude<PlanningView, 'index'>; onBack: () => void }) {
  const project = planningProjects[projectKey];
  const scrollToChapter = (number: string) => {
    document.getElementById(`planning-${projectKey}-${number}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <article className={`planning-case planning-case-${project.accent} panel-reveal`}>
      <button className="archive-back planning-case-back" type="button" onClick={onBack}>← planning files</button>
      <header className="planning-case-overview">
        <div className="planning-case-cover"><img src={project.cover} alt={`${project.englishTitle} cover`} /></div>
        <div className="planning-case-copy">
          <span className="project-index">{project.number} / {project.eyebrow}</span>
          <h2>{project.title}</h2>
          {projectKey !== 'deqing' && <h3>{project.englishTitle}</h3>}
          <p>{project.description}</p>
          {project.awards.length > 0 && (
            <div className="planning-awards" aria-label="Project awards">
              {project.awards.map((award) => <span key={award}>✦ {award}</span>)}
              {project.recognition && <p>{project.recognition}</p>}
            </div>
          )}
          <dl>
            {project.role && <div><dt>ROLE</dt><dd>{project.role}</dd></div>}
            <div><dt>FORMAT</dt><dd>Selected planning case</dd></div>
            <div><dt>SOURCE</dt><dd>{project.sourceCount.toLowerCase()}</dd></div>
            <div><dt>FLOW</dt><dd>Problem → Insight → Strategy → Activation</dd></div>
          </dl>
          <a className="planning-download" href={project.download} download>
            <Download aria-hidden="true" /> DOWNLOAD FULL PROPOSAL <span>↓</span>
          </a>
        </div>
      </header>

      <nav className="planning-case-nav" style={{ '--planning-columns': project.chapters.length } as CSSProperties} aria-label={`${project.englishTitle} chapters`}>
        {project.chapters.map((chapter) => (
          <button key={chapter.number} type="button" onClick={() => scrollToChapter(chapter.number)}>
            <b>{chapter.number}</b><span>{chapter.title}</span>
          </button>
        ))}
      </nav>

      <div className="planning-chapters">
        {project.chapters.map((chapter, index) => (
          <section className="planning-chapter" id={`planning-${projectKey}-${chapter.number}`} key={chapter.number}>
            <header>
              <span>{chapter.number}</span>
              <h3>{chapter.title}</h3>
              <p>{chapter.note}</p>
            </header>
            <figure className={index % 3 === 1 ? 'is-offset' : ''}>
              <img src={chapter.image} alt={`${project.englishTitle}: ${chapter.title}`} loading={index > 2 ? 'lazy' : 'eager'} />
            </figure>
          </section>
        ))}
      </div>
    </article>
  );
}

type LightboxState = { images: string[]; index: number; title: string };

function PhotoLightbox({ state, onClose, onStep }: { state: LightboxState; onClose: () => void; onStep: (direction: number) => void }) {
  return (
    <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`${state.title} image viewer`} onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close enlarged photograph">×</button>
      <button className="lightbox-arrow lightbox-prev" onClick={(event) => { event.stopPropagation(); onStep(-1); }} aria-label="Previous photograph">←</button>
      <figure className="lightbox-figure" onClick={(event) => event.stopPropagation()}>
        <img src={state.images[state.index]} alt={`${state.title}, enlarged photograph ${state.index + 1}`} />
        <figcaption><span>{state.title}</span><span>{String(state.index + 1).padStart(2, '0')} / {String(state.images.length).padStart(2, '0')}</span></figcaption>
      </figure>
      <button className="lightbox-arrow lightbox-next" onClick={(event) => { event.stopPropagation(); onStep(1); }} aria-label="Next photograph">→</button>
    </div>
  );
}

function PhotoArchive({ view, setView, onIndexReady }: { view: PhotoView; setView: (view: PhotoView) => void; onIndexReady: () => void }) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [indexCoversLoaded, setIndexCoversLoaded] = useState([false, false]);
  const stepLightbox = (direction: number) => setLightbox((current) => current ? {
    ...current,
    index: (current.index + direction + current.images.length) % current.images.length,
  } : current);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null);
      if (event.key === 'ArrowLeft') stepLightbox(-1);
      if (event.key === 'ArrowRight') stepLightbox(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightbox]);

  useEffect(() => {
    if (indexCoversLoaded.every(Boolean)) onIndexReady();
  }, [indexCoversLoaded, onIndexReady]);

  const markIndexCoverReady = (index: number) => {
    setIndexCoversLoaded((current) => current[index] ? current : current.map((loaded, itemIndex) => itemIndex === index ? true : loaded));
  };

  const viewer = lightbox && typeof document !== 'undefined'
    ? createPortal(<PhotoLightbox state={lightbox} onClose={() => setLightbox(null)} onStep={stepLightbox} />, document.body)
    : null;

  if (view === 'index') {
    return (
      <>
        <div className={`photo-index panel-reveal${indexCoversLoaded.every(Boolean) ? ' is-ready' : ''}`}>
          <button onClick={() => setView('portrait')}>
            <img src={portraitEntryCover} alt="Portrait photography preview" onLoad={() => markIndexCoverReady(0)} onError={() => markIndexCoverReady(0)} />
            <span><b>PORTRAITS</b><small>5 SERIES</small></span>
          </button>
          <button onClick={() => setView('street')}>
            <img src={streetPhotos[0]} alt="Observation photography preview" onLoad={() => markIndexCoverReady(1)} onError={() => markIndexCoverReady(1)} />
            <span><b>OBSERVATIONS</b><small>10 STREET NOTES</small></span>
          </button>
        </div>
        {viewer}
      </>
    );
  }

  if (view.startsWith('series:')) {
    const seriesIndex = Number(view.split(':')[1]);
    const series = portraitSeries[seriesIndex];
    const renderSeriesPhoto = (image: string, index: number) => (
      <figure className="photo-frame" key={image}>
        <button className="photo-zoom" onClick={() => setLightbox({ images: series.images, index, title: series.title })} aria-label={`Enlarge ${series.title}, photograph ${index + 1}`}>
          <img src={image} alt={`${series.title}, photograph ${index + 1}`} loading={index > 2 ? 'lazy' : 'eager'} />
        </button>
        <figcaption>{String(index + 1).padStart(2, '0')}</figcaption>
      </figure>
    );
    return (
      <div className="photo-archive panel-reveal">
        <button className="archive-back" onClick={() => setView('portrait')}>← all portrait series</button>
        <div className="series-heading">
          <span>{String(seriesIndex + 1).padStart(2, '0')} / 05</span>
          <h3>{series.title}</h3>
        </div>
        <div className={`series-gallery${seriesIndex === 0 || seriesIndex === 2 ? ' series-gallery-ordered' : ''}`}>
          {seriesIndex === 0 && (
            <div className="series-landscape-stack">
              {series.images.slice(0, 2).map((image, index) => renderSeriesPhoto(image, index))}
            </div>
          )}
          {series.images.slice(seriesIndex === 0 ? 2 : 0).map((image, index) =>
            renderSeriesPhoto(image, index + (seriesIndex === 0 ? 2 : 0))
          )}
        </div>
        {viewer}
      </div>
    );
  }

  return (
    <div className="photo-archive panel-reveal">
      <button className="archive-back" onClick={() => setView('index')}>← all photography</button>
      <div className={view === 'portrait' ? 'series-grid' : 'street-grid'}>
        {view === 'portrait' ? portraitSeries.map((series, index) => (
          <button className="series-card photo-frame" key={series.title} onClick={() => setView(`series:${index}`)}>
            <img src={series.cover} alt={`${series.title} portrait series`} />
            <span><b>{String(index + 1).padStart(2, '0')}</b>{series.title}</span>
          </button>
        )) : streetPhotos.map((image, index) => (
          <figure className="photo-frame" key={image}>
            <button className="photo-zoom" onClick={() => setLightbox({ images: streetPhotos, index, title: 'Observations' })} aria-label={`Enlarge observation ${index + 1}`}>
              <img src={image} alt={`Observation ${index + 1}`} loading={index > 3 ? 'lazy' : 'eager'} />
            </button>
            <figcaption>Observation {String(index + 1).padStart(2, '0')}</figcaption>
          </figure>
        ))}
      </div>
      {viewer}
    </div>
  );
}

function VideoPlayer({ activeIndex, setActiveIndex }: { activeIndex: number; setActiveIndex: (index: number) => void }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const swipeStart = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const go = (direction: number) => {
    setIsPlaying(false);
    setActiveIndex((activeIndex + direction + videos.length) % videos.length);
  };

  useGSAP(() => {
    gsap.fromTo(
      '.video-card',
      { y: 20, rotation: activeIndex % 2 === 0 ? -2.4 : 2.4, autoAlpha: 0, scale: 0.96 },
      { y: 0, rotation: 0, autoAlpha: 1, scale: 1, duration: 0.56, ease: 'power3.out' },
    );
    gsap.fromTo(
      '.screen-content',
      { autoAlpha: 0.45, scale: 0.985 },
      { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
    );
  }, { scope: carouselRef, dependencies: [activeIndex], revertOnUpdate: true });

  const activeVideo = videos[activeIndex];
  return (
    <div className="video-player panel-reveal" ref={carouselRef}>
      <div className="computer-screen">
        <div className="screen-bar"><span>MOMO PLAYER</span><span>{String(activeIndex + 1).padStart(2, '0')} / 05</span></div>
        <div className="screen-content">
          <video
            ref={videoRef}
            key={activeVideo.src}
            src={activeVideo.src}
            poster={activeVideo.cover}
            controls={isPlaying}
            preload="metadata"
            playsInline
            onEnded={() => setIsPlaying(false)}
          />
          {!isPlaying && (
            <button
              className="play-control"
              aria-label={`Play ${activeVideo.title}`}
              onClick={() => {
                setIsPlaying(true);
                requestAnimationFrame(() => videoRef.current?.play());
              }}
            >▶</button>
          )}
        </div>
      </div>

      <div className="video-side">
        <div
          className="video-carousel"
          onPointerDown={(event) => { swipeStart.current = event.clientX; }}
          onPointerUp={(event) => {
            if (swipeStart.current === null) return;
            const distance = event.clientX - swipeStart.current;
            if (Math.abs(distance) > 36) go(distance < 0 ? 1 : -1);
            swipeStart.current = null;
          }}
        >
          <article
            className={`video-card video-card-tone-${activeIndex % 3}`}
            key={activeVideo.title}
            aria-label={`${activeVideo.title} details`}
          >
            <span className="video-number">{String(activeIndex + 1).padStart(2, '0')}</span>
            <span className="video-card-copy">
              <b>{activeVideo.title}</b>
              <small>{activeVideo.note}</small>
              <span className="video-details">
                {activeVideo.details.map((detail) => <span key={detail}>{detail}</span>)}
              </span>
              {activeVideo.fullUrl && (
                <a className="video-full-link" href={activeVideo.fullUrl} target="_blank" rel="noreferrer">观看完整版 ↗</a>
              )}
            </span>
          </article>
        </div>

        <div className="video-controls">
          <button onClick={() => go(-1)} aria-label="Previous video">←</button>
          <p><b>{String(activeIndex + 1).padStart(2, '0')} / 05</b><span>choose a film</span></p>
          <button onClick={() => go(1)} aria-label="Next video">→</button>
        </div>
      </div>
    </div>
  );
}

function PersonalStuffViewer({ itemId, origin, onClose }: { itemId: PersonalStuffId; origin: PersonalStuffOrigin; onClose: () => void }) {
  const viewerRef = useRef<HTMLElement>(null);
  const medalPlateRef = useRef<HTMLImageElement>(null);
  const [medalSide, setMedalSide] = useState<'front' | 'back'>('front');
  const [isClosing, setIsClosing] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const item = personalStuffItems.find((candidate) => candidate.id === itemId)!;

  useGSAP(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const bounds = viewer.getBoundingClientRect();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.fromTo(viewer, {
      x: origin.x - (bounds.left + bounds.width / 2),
      y: origin.y - (bounds.top + bounds.height / 2),
      scale: Math.min(origin.width / Math.max(bounds.width, 1), origin.height / Math.max(bounds.height, 1)),
      autoAlpha: reducedMotion ? 1 : .16,
    }, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: reducedMotion ? 0 : .52, ease: 'power3.out' });
    gsap.fromTo('.stuff-viewer-backdrop', { autoAlpha: 0 }, { autoAlpha: 1, duration: reducedMotion ? 0 : .36 });
    gsap.fromTo('.stuff-viewer-note', { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: reducedMotion ? 0 : .34, delay: reducedMotion ? 0 : .22 });
  }, { scope: viewerRef });

  const returnToDrawer = useCallback(() => {
    if (isClosing || !viewerRef.current) return;
    setIsClosing(true);
    const viewer = viewerRef.current;
    const bounds = viewer.getBoundingClientRect();
    gsap.to(viewer, {
      x: origin.x - (bounds.left + bounds.width / 2),
      y: origin.y - (bounds.top + bounds.height / 2),
      scale: Math.min(origin.width / Math.max(bounds.width, 1), origin.height / Math.max(bounds.height, 1)),
      autoAlpha: 0,
      duration: .36,
      ease: 'power2.in',
      onComplete: onClose,
    });
    gsap.to(['.stuff-viewer-backdrop', '.stuff-viewer-note'], { autoAlpha: 0, duration: .25 });
  }, [isClosing, onClose, origin]);

  const flipMedal = () => {
    const plate = medalPlateRef.current;
    if (!plate || isFlipping) return;
    setIsFlipping(true);
    const nextSide = medalSide === 'front' ? 'back' : 'front';
    gsap.timeline({ onComplete: () => setIsFlipping(false) })
      .to(plate, { rotationY: 90, duration: .25, ease: 'power2.in' })
      .call(() => {
        setMedalSide(nextSide);
        plate.src = nextSide === 'front' ? item.src : item.backSrc!;
        gsap.set(plate, { rotationY: -90 });
      })
      .to(plate, { rotationY: 0, duration: .29, ease: 'power2.out' });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') returnToDrawer(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [returnToDrawer]);

  return (
    <div className="stuff-viewer" role="dialog" aria-modal="true" aria-label={item.note}>
      <button className="stuff-viewer-backdrop" type="button" onClick={returnToDrawer} aria-label="Return item to drawer" />
      <figure ref={viewerRef} className={`stuff-viewer-card stuff-viewer-${item.kind}`}>
        {item.kind === 'medal' ? (
          <div className="stuff-medal-composite">
            <img className="stuff-medal-ribbon" src={item.ribbonSrc} alt="" draggable={false} />
            <img ref={medalPlateRef} className="stuff-medal-plate" src={medalSide === 'front' ? item.src : item.backSrc} alt={medalSide === 'front' ? 'Front of the medal' : 'Back of the medal'} draggable={false} />
          </div>
        ) : (
          <button className="stuff-viewer-media" type="button" onClick={returnToDrawer} aria-label="Return item to drawer"><img src={item.src} alt={item.note} draggable={false} /></button>
        )}
        <figcaption className="stuff-viewer-note">{item.note}</figcaption>
        {item.kind === 'medal' && <button className="stuff-medal-flip" type="button" disabled={isFlipping} onClick={flipMedal}>FLIP <RotateCw /></button>}
      </figure>
    </div>
  );
}

function AboutPolaroid({ onClose }: { onClose: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pickupRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasRenderedFlipRef = useRef(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLeaving(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useGSAP(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo('.about-backdrop', { autoAlpha: 0 }, {
        autoAlpha: 1,
        duration: reducedMotion ? 0 : .4,
      }, 0)
      .fromTo(pickupRef.current, {
        x: '-6vw',
        y: '9vh',
        scale: .16,
        rotation: -8,
        autoAlpha: .3,
      }, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: -1.2,
        autoAlpha: 1,
        duration: reducedMotion ? 0 : .82,
        ease: 'back.out(1.22)',
      }, .04)
      .fromTo('.about-stage-hint', { y: 8, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: reducedMotion ? 0 : .3,
      }, '-=.22');
  }, { scope: stageRef });

  useGSAP(() => {
    if (!cardRef.current) return;
    if (!hasRenderedFlipRef.current) {
      hasRenderedFlipRef.current = true;
      gsap.set(cardRef.current, { rotationY: 0 });
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.to(cardRef.current, {
      rotationY: isFlipped ? 180 : 0,
      duration: reducedMotion ? 0 : .66,
      ease: 'power3.inOut',
      overwrite: 'auto',
    });
  }, { scope: stageRef, dependencies: [isFlipped] });

  useGSAP(() => {
    if (!isLeaving) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.timeline({ defaults: { ease: 'power3.in' }, onComplete: onClose })
      .to('.about-stage-hint', { autoAlpha: 0, duration: reducedMotion ? 0 : .12 }, 0)
      .to(pickupRef.current, {
        x: '-6vw',
        y: '9vh',
        scale: .16,
        rotation: -8,
        autoAlpha: 0,
        duration: reducedMotion ? 0 : .46,
      }, 0)
      .to('.about-backdrop', { autoAlpha: 0, duration: reducedMotion ? 0 : .34 }, .08);
  }, { scope: stageRef, dependencies: [isLeaving] });

  const flip = () => {
    if (!isLeaving) setIsFlipped((value) => !value);
  };

  return (
    <div ref={stageRef} className="about-stage">
      <h2 className="sr-only">About Jiayan Mo</h2>
      <p className="sr-only">Flip the Polaroid to reveal a handwritten motto.</p>
      <button className="about-backdrop" type="button" onClick={() => setIsLeaving(true)} aria-label="Put the Polaroid back" />
      <button className="contact-stage-close" type="button" onClick={() => setIsLeaving(true)} aria-label="Close about Polaroid"><X /></button>

      <div ref={pickupRef} className="about-pickup-object">
        <div ref={cardRef} className="about-polaroid-card">
          <section className="about-polaroid-face about-polaroid-front" aria-hidden={isFlipped} inert={isFlipped}>
            <button type="button" onClick={flip} aria-label="Turn the Polaroid over">
              <span className="about-photo-window"><img src="/portfolio/about/photo.jpg" alt="Jiayan Mo at sunset" /></span>
              <img className="about-year-writing" src="/portfolio/about/handwriting-year.png" alt="2026, handwritten" />
            </button>
          </section>

          <section className="about-polaroid-face about-polaroid-back" aria-hidden={!isFlipped} inert={!isFlipped}>
            <button type="button" onClick={flip} aria-label="Turn the Polaroid to the photo">
              <img className="about-motto-writing" src="/portfolio/about/handwriting.png" alt="I am greater than I was, handwritten" />
            </button>
          </section>
        </div>
      </div>
      <p className="about-stage-hint">CLICK THE POLAROID TO FLIP · CLICK OUTSIDE TO RETURN</p>
    </div>
  );
}

function ContactBadge({ onClose }: { onClose: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pickupRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasRenderedFlipRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLeaving(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useGSAP(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo('.contact-backdrop', { autoAlpha: 0 }, {
        autoAlpha: 1,
        duration: reducedMotion ? 0 : .42,
      }, 0)
      .fromTo(pickupRef.current, {
        x: '11vw',
        y: '4vh',
        scale: .16,
        rotation: -5,
        autoAlpha: .25,
      }, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        autoAlpha: 1,
        duration: reducedMotion ? 0 : .82,
        ease: 'back.out(1.18)',
      }, .05)
      .fromTo('.contact-lanyard', { rotation: 14, y: -18 }, {
        rotation: 0,
        y: 0,
        duration: reducedMotion ? 0 : .92,
        ease: 'elastic.out(1, .5)',
      }, .16)
      .fromTo('.contact-stage-hint', { y: 8, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: reducedMotion ? 0 : .3,
      }, '-=.25');
  }, { scope: stageRef });

  useGSAP(() => {
    if (!cardRef.current) return;
    if (!hasRenderedFlipRef.current) {
      hasRenderedFlipRef.current = true;
      gsap.set(cardRef.current, { rotationY: 0 });
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.to(cardRef.current, {
      rotationY: isFlipped ? 180 : 0,
      duration: reducedMotion ? 0 : .62,
      ease: 'power3.inOut',
      overwrite: 'auto',
    });
  }, { scope: stageRef, dependencies: [isFlipped] });

  useGSAP(() => {
    if (!isLeaving) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.timeline({ defaults: { ease: 'power3.in' }, onComplete: onClose })
      .to('.contact-stage-hint', { autoAlpha: 0, duration: reducedMotion ? 0 : .12 }, 0)
      .to(pickupRef.current, {
        x: '11vw',
        y: '4vh',
        scale: .16,
        rotation: 4,
        autoAlpha: 0,
        duration: reducedMotion ? 0 : .48,
      }, 0)
      .to('.contact-backdrop', {
        autoAlpha: 0,
        duration: reducedMotion ? 0 : .36,
      }, .08);
  }, { scope: stageRef, dependencies: [isLeaving] });

  const copyContact = async (kind: 'email' | 'phone', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const flip = () => {
    if (!isLeaving) setIsFlipped((value) => !value);
  };

  return (
    <div ref={stageRef} className="contact-stage">
      <h2 className="sr-only">Momo&apos;s contact staff ID</h2>
      <p className="sr-only">Flip the staff ID to view and use contact details.</p>
      <button className="contact-backdrop" type="button" onClick={() => setIsLeaving(true)} aria-label="Put the contact card back" />
      <button className="contact-stage-close" type="button" onClick={() => setIsLeaving(true)} aria-label="Close contact card"><X /></button>

      <div ref={pickupRef} className="contact-pickup-object">
        <div className="contact-lanyard" aria-hidden="true">
          <span className="contact-lanyard-loop" />
          <span className="contact-lanyard-tab" />
          <span className="contact-metal-clip"><i /></span>
        </div>

        <div className="contact-card-shell">
          <div ref={cardRef} className="contact-card">
            <section className="contact-card-face contact-card-front" aria-hidden={isFlipped} inert={isFlipped}>
              <div className="contact-card-inner">
                <header className="contact-id-heading"><b>MOMO’S DESK</b><span>STAFF ID · 2026</span></header>
                <div className="contact-avatar-wrap"><img src="/portfolio/contact/avatar-20260907.png" alt="Portrait of Jiayan Mo" /></div>
                <dl className="contact-identity-list">
                  <div><dt>NAME</dt><dd>MOMO / JIAYAN MO</dd></div>
                  <div><dt>ROLE</dt><dd>MAKING THINGS</dd></div>
                  <div><dt>STATUS</dt><dd><i /> OPEN TO IDEAS</dd></div>
                </dl>
                <div className="contact-id-footer">
                  <span className="contact-barcode" aria-hidden="true" />
                  <dl><div><dt>ID</dt><dd>MOMO-2026</dd></div><div><dt>ACCESS</dt><dd>ALL AREAS</dd></div></dl>
                </div>
                <button className="contact-flip-button" type="button" onClick={flip}>FLIP <RotateCw /></button>
              </div>
            </section>

            <section className="contact-card-face contact-card-back" aria-hidden={!isFlipped} inert={!isFlipped}>
              <div className="contact-card-inner contact-card-inner-back">
                <header className="contact-back-heading"><h2>LET’S TALK.</h2></header>
                <div className="contact-actions">
                  <button type="button" onClick={() => copyContact('email', 'jiayanmomo@qq.com')}>
                    <Mail /><span><small>EMAIL</small><b>jiayanmomo@qq.com</b></span>{copied === 'email' ? <Check /> : <Copy />}
                  </button>
                  <button type="button" onClick={() => copyContact('phone', '191 6867 7856')}>
                    <Phone /><span><small>PHONE</small><b>191 6867 7856</b></span>{copied === 'phone' ? <Check /> : <Copy />}
                  </button>
                  <a href="/portfolio/contact/cv-jiayan-mo.pdf" download>
                    <Download /><span><small>CV</small><b>Download PDF</b></span><i>↓</i>
                  </a>
                  <a href="https://www.instagram.com/404sugarra/" target="_blank" rel="noreferrer">
                    <ExternalLink /><span><small>INSTAGRAM</small><b>@404sugarra</b></span><i>↗</i>
                  </a>
                </div>
                <button className="contact-flip-button" type="button" onClick={flip}>FLIP BACK <RotateCw /></button>
                <p className="contact-easter-egg"><span aria-hidden="true">↩</span> IF FOUND, PLEASE RETURN TO MOMO’S DESK.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <p className="contact-stage-hint">FLIP THE STAFF ID · CLICK OUTSIDE TO RETURN</p>
    </div>
  );
}

export default function Home() {
  const stageRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStuff, setSelectedStuff] = useState<{ id: PersonalStuffId; origin: PersonalStuffOrigin } | null>(null);
  const [photoView, setPhotoView] = useState<PhotoView>('index');
  const [photoIndexReady, setPhotoIndexReady] = useState(false);
  const [cameraFlashPulse, setCameraFlashPulse] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [designView, setDesignView] = useState<DesignView>('index');
  const [planningView, setPlanningView] = useState<PlanningView>('index');

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        gsap.from('.site-mark span', {
          y: reduceMotion ? 0 : -12,
          autoAlpha: 0,
          duration: reduceMotion ? 0 : 0.8,
          stagger: 0.12,
          ease: 'power2.out',
        });
      },
      stageRef.current ?? undefined,
    );
    return () => mm.revert();
  }, { scope: stageRef });

  useGSAP(() => {
    if (!cameraFlashPulse) return;
    gsap.timeline({ onComplete: () => setActivePanel('photo') })
      .set('.camera-flash', { autoAlpha: 0 })
      .to('.camera-flash', { autoAlpha: 0.82, duration: 0.055, ease: 'power4.in' })
      .to('.camera-flash', { autoAlpha: 0, duration: 0.14, ease: 'power2.out' });
  }, { scope: stageRef, dependencies: [cameraFlashPulse] });

  useGSAP(() => {
    if (!activePanel || !dialogRef.current) return;
    dialogRef.current.scrollTop = 0;
    gsap.fromTo(
      '.panel-reveal',
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.52, ease: 'power3.out', stagger: 0.06 },
    );
    if (activePanel === 'photo' && photoView === 'index' && photoIndexReady) {
      gsap.fromTo(
        '.photo-index button',
        {
          y: -90,
          rotation: (index) => index === 0 ? -9 : 8,
          autoAlpha: 0,
        },
        {
          y: 0,
          rotation: (index) => index === 0 ? -2.5 : 2.2,
          autoAlpha: 1,
          duration: 0.72,
          stagger: 0.11,
          ease: 'back.out(1.45)',
          delay: 0.08,
        },
      );
    } else if (activePanel === 'photo') {
      gsap.fromTo(
        '.photo-frame',
        { y: 24, autoAlpha: 0, scale: 0.985 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.48, stagger: 0.045, ease: 'power3.out' },
      );
    }
  }, { scope: dialogRef, dependencies: [activePanel, photoView, photoIndexReady, designView, planningView] });

  const closePanel = () => setActivePanel(null);
  const openObject = (panel: DeskPanel) => {
    setDrawerOpen(false);
    setSelectedStuff(null);
    if (panel === 'photo') {
      setPhotoView('index');
      setPhotoIndexReady(false);
      setCameraFlashPulse((pulse) => pulse + 1);
      return;
    }
    if (panel === 'design') setDesignView('index');
    if (panel === 'planning') setPlanningView('index');
    setActivePanel(panel);
  };

  const staticPanel = activePanel && activePanel !== 'photo' && activePanel !== 'video' && activePanel !== 'design' && activePanel !== 'planning' && activePanel !== 'polaroid' && activePanel !== 'badge' ? panels[activePanel] : null;

  return (
    <main className={`portfolio-stage${entered ? ' is-entered' : ''}${drawerOpen ? ' drawer-is-open' : ''}`} ref={stageRef}>
      <header className="site-mark">
        <span>MOMO’S DESK</span>
        <span>PORTFOLIO · 2026</span>
      </header>

      <section className="scene-wrap" aria-label="Interactive miniature creative desk">
        <DeskScene
          entered={entered}
          drawerOpen={drawerOpen}
          onEnter={() => setEntered(true)}
          onSelect={openObject}
          onDrawerToggle={() => { setSelectedStuff(null); setDrawerOpen((value) => !value); }}
          onStuffSelect={(id, origin) => setSelectedStuff({ id, origin })}
        />
        {!entered && <button className="enter-desk" onClick={() => setEntered(true)}><span>come closer</span><span aria-hidden="true">↘</span></button>}
      </section>

      <div className="camera-flash" aria-hidden="true" />

      {entered && !drawerOpen && (
        <button className="zoom-out" onClick={() => { setActivePanel(null); setEntered(false); setDrawerOpen(false); }}>
          <span>−</span> zoom out
        </button>
      )}

      {drawerOpen && (
        <button className="drawer-close-control" onClick={() => { setSelectedStuff(null); setDrawerOpen(false); }}>
          close drawer <span aria-hidden="true">↑</span>
        </button>
      )}

      {drawerOpen && selectedStuff && (
        <PersonalStuffViewer itemId={selectedStuff.id} origin={selectedStuff.origin} onClose={() => setSelectedStuff(null)} />
      )}

      {activePanel === 'polaroid' && <AboutPolaroid onClose={closePanel} />}

      {activePanel === 'badge' && <ContactBadge onClose={closePanel} />}

      <Dialog open={Boolean(activePanel && activePanel !== 'polaroid' && activePanel !== 'badge')} onOpenChange={(open) => !open && closePanel()}>
        <DialogContent ref={dialogRef} className={`portfolio-dialog portfolio-dialog-${activePanel ?? 'none'}`} showCloseButton>
          {activePanel === 'photo' && (
            <>
              <DialogHeader className="panel-reveal">
                <span className="dialog-eyebrow">CAMERA ROLL / 01</span>
                <DialogTitle>Photography</DialogTitle>
                <DialogDescription>Stories of life, captured frame by frame.</DialogDescription>
              </DialogHeader>
              <PhotoArchive view={photoView} setView={setPhotoView} onIndexReady={() => setPhotoIndexReady(true)} />
            </>
          )}

          {activePanel === 'video' && (
            <>
              <DialogHeader className="panel-reveal video-heading">
                <span className="dialog-eyebrow">ON SCREEN / 02</span>
                <DialogTitle>Video works</DialogTitle>
                <DialogDescription>Ideas in motion, stories in frames.</DialogDescription>
              </DialogHeader>
              <VideoPlayer activeIndex={videoIndex} setActiveIndex={setVideoIndex} />
            </>
          )}

          {activePanel === 'design' && (
            <>
              {designView === 'index' && (
                <>
                  <DialogHeader className="panel-reveal design-heading">
                    <span className="dialog-eyebrow">{panels.design.eyebrow}</span>
                    <DialogTitle>{panels.design.title}</DialogTitle>
                    <DialogDescription>{panels.design.description}</DialogDescription>
                  </DialogHeader>
                  <DesignIndex onSelect={setDesignView} />
                </>
              )}
              {designView === 'zine' && <ZineProject onBack={() => setDesignView('index')} />}
              {designView === 'campaign' && <CampaignProject onBack={() => setDesignView('index')} />}
              {designView === 'internship' && <InternshipProject onBack={() => setDesignView('index')} />}
            </>
          )}

          {activePanel === 'planning' && (
            <>
              {planningView === 'index' && (
                <>
                  <DialogHeader className="panel-reveal planning-heading">
                    <span className="dialog-eyebrow">{panels.planning.eyebrow}</span>
                    <DialogTitle>{panels.planning.title}</DialogTitle>
                    <DialogDescription>{panels.planning.description}</DialogDescription>
                  </DialogHeader>
                  <PlanningIndex onSelect={setPlanningView} />
                </>
              )}
              {planningView !== 'index' && <PlanningCase projectKey={planningView} onBack={() => setPlanningView('index')} />}
            </>
          )}

          {staticPanel && (
            <>
              <DialogHeader className="panel-reveal">
                <span className="dialog-eyebrow">{staticPanel.eyebrow}</span>
                <DialogTitle>{staticPanel.title}</DialogTitle>
                <DialogDescription>{staticPanel.description}</DialogDescription>
              </DialogHeader>

              {staticPanel.images && (
                <div className={`work-grid work-grid-${activePanel} panel-reveal`}>
                  {staticPanel.images.map((image, index) => (
                    <figure key={image}>
                      <img src={image} alt={`Placeholder work ${index + 1}`} />
                      <figcaption>{String(index + 1).padStart(2, '0')}</figcaption>
                    </figure>
                  ))}
                </div>
              )}

            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
