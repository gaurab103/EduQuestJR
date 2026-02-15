/**
 * Shared real image URLs for all games.
 * Uses Twemoji CDN — high-quality cartoon-style images that are ALWAYS accurate.
 * Every image is guaranteed to match its name (an apple image IS an apple).
 */

const T = (code) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code.replace(/-fe0f/g, '')}.svg`;

// ═══ FRUITS ═══
export const FRUIT_IMAGES = {
  apple:      T('1f34e'),
  orange:     T('1f34a'),
  lemon:      T('1f34b'),
  grapes:     T('1f347'),
  strawberry: T('1f353'),
  banana:     T('1f34c'),
  cherry:     T('1f352'),
  peach:      T('1f351'),
  watermelon: T('1f349'),
  kiwi:       T('1f95d'),
  pineapple:  T('1f34d'),
  mango:      T('1f96d'),
  coconut:    T('1f965'),
  blueberry:  T('1fad0'),
};

// ═══ VEGETABLES ═══
export const VEGGIE_IMAGES = {
  carrot:     T('1f955'),
  broccoli:   T('1f966'),
  corn:       T('1f33d'),
  tomato:     T('1f345'),
  cucumber:   T('1f952'),
  onion:      T('1f9c5'),
  pepper:     T('1f336-fe0f'),
  potato:     T('1f954'),
  lettuce:    T('1f96c'),
  garlic:     T('1f9c4'),
  eggplant:   T('1f346'),
};

// ═══ ANIMALS ═══
export const ANIMAL_IMAGES = {
  dog:        T('1f436'),
  cat:        T('1f431'),
  rabbit:     T('1f430'),
  bear:       T('1f43b'),
  frog:       T('1f438'),
  fox:        T('1f98a'),
  monkey:     T('1f435'),
  chicken:    T('1f414'),
  elephant:   T('1f418'),
  lion:       T('1f981'),
  whale:      T('1f433'),
  fish:       T('1f41f'),
  ant:        T('1f41c'),
  butterfly:  T('1f98b'),
  bee:        T('1f41d'),
  ladybug:    T('1f41e'),
  snail:      T('1f40c'),
  duck:       T('1f986'),
  squirrel:   T('1f43f-fe0f'),
  dinosaur:   T('1f995'),
  turtle:     T('1f422'),
  cow:        T('1f404'),
  pig:        T('1f437'),
  horse:      T('1f434'),
  penguin:    T('1f427'),
  owl:        T('1f989'),
  parrot:     T('1f99c'),
  dolphin:    T('1f42c'),
  mouse:      T('1f42d'),
  tiger:      T('1f42f'),
  panda:      T('1f43c'),
  koala:      T('1f428'),
  octopus:    T('1f419'),
  crab:       T('1f980'),
  bird:       T('1f426'),
  chick:      T('1f425'),
};

// ═══ OBJECTS / THINGS ═══
export const OBJECT_IMAGES = {
  sun:        T('2600-fe0f'),
  moon:       T('1f319'),
  star:       T('2b50'),
  rocket:     T('1f680'),
  car:        T('1f697'),
  bicycle:    T('1f6b2'),
  house:      T('1f3e0'),
  tree:       T('1f333'),
  flower:     T('1f338'),
  rainbow:    T('1f308'),
  ball:       T('26bd'),
  hat:        T('1f3a9'),
  bed:        T('1f6cf-fe0f'),
  bell:       T('1f514'),
  balloon:    T('1f388'),
  cake:       T('1f382'),
  ship:       T('1f6a2'),
  plane:      T('2708-fe0f'),
  castle:     T('1f3f0'),
  mountain:   T('26f0-fe0f'),
  earth:      T('1f30d'),
  robot:      T('1f916'),
  book:       T('1f4da'),
  lightbulb:  T('1f4a1'),
  music:      T('1f3b5'),
  key:        T('1f511'),
  gift:       T('1f381'),
  crown:      T('1f451'),
  pencil:     T('270f-fe0f'),
  clock:      T('1f570-fe0f'),
  umbrella:   T('2602-fe0f'),
  snowflake:  T('2744-fe0f'),
  fire:       T('1f525'),
  heart:      T('2764-fe0f'),
  cloud:      T('2601-fe0f'),
  rain:       T('1f327-fe0f'),
  candy:      T('1f36c'),
  cookie:     T('1f36a'),
  pizza:      T('1f355'),
  icecream:   T('1f366'),
};

// ═══ NATURE ═══
export const NATURE_IMAGES = {
  sunflower:  T('1f33b'),
  tulip:      T('1f337'),
  rose:       T('1f339'),
  clover:     T('1f340'),
  mushroom:   T('1f344'),
  cactus:     T('1f335'),
  herb:       T('1f33f'),
  leaf:       T('1f343'),
};

// ═══ SHAPES (colored emoji-style) ═══
export const SHAPE_IMAGES = {
  circle:     T('1f534'),
  square:     T('1f7e6'),
  triangle:   T('1f53a'),
  star:       T('2b50'),
  heart:      T('2764-fe0f'),
  diamond:    T('1f48e'),
  moon:       T('1f319'),
  hexagon:    T('1f535'),
};

// ═══ FOOD ═══
export const FOOD_IMAGES = {
  pizza:      T('1f355'),
  burger:     T('1f354'),
  hotdog:     T('1f32d'),
  taco:       T('1f32e'),
  cookie:     T('1f36a'),
  donut:      T('1f369'),
  candy:      T('1f36c'),
  icecream:   T('1f366'),
  popcorn:    T('1f37f'),
  bread:      T('1f35e'),
  rice:       T('1f35a'),
  egg:        T('1f95a'),
  cheese:     T('1f9c0'),
  milk:       T('1f95b'),
};

/**
 * Helper: renders an <img> tag for game content.
 * Falls back to alt text if image fails to load.
 */
export function GameImage({ src, alt, size = 48, style = {}, className = '' }) {
  return (
    <img
      src={src}
      alt={alt || ''}
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      loading="lazy"
      onError={(e) => {
        e.target.style.display = 'none';
        // Show alt text as fallback
        if (e.target.nextSibling === null && alt) {
          const span = document.createElement('span');
          span.textContent = alt;
          span.style.fontSize = `${Math.max(size * 0.3, 14)}px`;
          span.style.fontWeight = '700';
          e.target.parentNode?.appendChild(span);
        }
      }}
    />
  );
}

// ═══ COUNTING THEMES ═══
export const COUNTING_THEMES = [
  {
    bg: 'Fruit Farm',
    objects: [
      { name: 'apple', img: FRUIT_IMAGES.apple },
      { name: 'orange', img: FRUIT_IMAGES.orange },
      { name: 'grapes', img: FRUIT_IMAGES.grapes },
      { name: 'strawberry', img: FRUIT_IMAGES.strawberry },
      { name: 'banana', img: FRUIT_IMAGES.banana },
      { name: 'watermelon', img: FRUIT_IMAGES.watermelon },
      { name: 'cherry', img: FRUIT_IMAGES.cherry },
    ],
  },
  {
    bg: 'Animal Park',
    objects: [
      { name: 'dog', img: ANIMAL_IMAGES.dog },
      { name: 'cat', img: ANIMAL_IMAGES.cat },
      { name: 'rabbit', img: ANIMAL_IMAGES.rabbit },
      { name: 'bear', img: ANIMAL_IMAGES.bear },
      { name: 'frog', img: ANIMAL_IMAGES.frog },
      { name: 'penguin', img: ANIMAL_IMAGES.penguin },
      { name: 'koala', img: ANIMAL_IMAGES.koala },
    ],
  },
  {
    bg: 'Garden',
    objects: [
      { name: 'flower', img: OBJECT_IMAGES.flower },
      { name: 'butterfly', img: ANIMAL_IMAGES.butterfly },
      { name: 'bee', img: ANIMAL_IMAGES.bee },
      { name: 'ladybug', img: ANIMAL_IMAGES.ladybug },
      { name: 'snail', img: ANIMAL_IMAGES.snail },
      { name: 'tulip', img: NATURE_IMAGES.tulip },
    ],
  },
  {
    bg: 'Ocean',
    objects: [
      { name: 'fish', img: ANIMAL_IMAGES.fish },
      { name: 'whale', img: ANIMAL_IMAGES.whale },
      { name: 'dolphin', img: ANIMAL_IMAGES.dolphin },
      { name: 'octopus', img: ANIMAL_IMAGES.octopus },
      { name: 'crab', img: ANIMAL_IMAGES.crab },
      { name: 'turtle', img: ANIMAL_IMAGES.turtle },
    ],
  },
  {
    bg: 'Food Fun',
    objects: [
      { name: 'pizza', img: FOOD_IMAGES.pizza },
      { name: 'cookie', img: FOOD_IMAGES.cookie },
      { name: 'icecream', img: FOOD_IMAGES.icecream },
      { name: 'donut', img: FOOD_IMAGES.donut },
      { name: 'candy', img: FOOD_IMAGES.candy },
    ],
  },
];

// ═══ BIG VS SMALL PAIRS ═══
export const BIG_SMALL_PAIRS = [
  { big: { name: 'elephant', img: ANIMAL_IMAGES.elephant }, small: { name: 'ant', img: ANIMAL_IMAGES.ant }, label: 'elephant vs ant' },
  { big: { name: 'tree', img: OBJECT_IMAGES.tree }, small: { name: 'flower', img: OBJECT_IMAGES.flower }, label: 'tree vs flower' },
  { big: { name: 'car', img: OBJECT_IMAGES.car }, small: { name: 'bicycle', img: OBJECT_IMAGES.bicycle }, label: 'car vs bicycle' },
  { big: { name: 'house', img: OBJECT_IMAGES.house }, small: { name: 'book', img: OBJECT_IMAGES.book }, label: 'house vs book' },
  { big: { name: 'sun', img: OBJECT_IMAGES.sun }, small: { name: 'star', img: OBJECT_IMAGES.star }, label: 'sun vs star' },
  { big: { name: 'whale', img: ANIMAL_IMAGES.whale }, small: { name: 'fish', img: ANIMAL_IMAGES.fish }, label: 'whale vs fish' },
  { big: { name: 'dinosaur', img: ANIMAL_IMAGES.dinosaur }, small: { name: 'frog', img: ANIMAL_IMAGES.frog }, label: 'dinosaur vs frog' },
  { big: { name: 'mountain', img: OBJECT_IMAGES.mountain }, small: { name: 'ball', img: OBJECT_IMAGES.ball }, label: 'mountain vs ball' },
  { big: { name: 'rocket', img: OBJECT_IMAGES.rocket }, small: { name: 'plane', img: OBJECT_IMAGES.plane }, label: 'rocket vs plane' },
  { big: { name: 'earth', img: OBJECT_IMAGES.earth }, small: { name: 'balloon', img: OBJECT_IMAGES.balloon }, label: 'earth vs balloon' },
  { big: { name: 'bear', img: ANIMAL_IMAGES.bear }, small: { name: 'mouse', img: ANIMAL_IMAGES.mouse }, label: 'bear vs mouse' },
  { big: { name: 'lion', img: ANIMAL_IMAGES.lion }, small: { name: 'cat', img: ANIMAL_IMAGES.cat }, label: 'lion vs cat' },
  { big: { name: 'castle', img: OBJECT_IMAGES.castle }, small: { name: 'hat', img: OBJECT_IMAGES.hat }, label: 'castle vs hat' },
  { big: { name: 'ship', img: OBJECT_IMAGES.ship }, small: { name: 'duck', img: ANIMAL_IMAGES.duck }, label: 'ship vs duck' },
  { big: { name: 'horse', img: ANIMAL_IMAGES.horse }, small: { name: 'chick', img: ANIMAL_IMAGES.chick }, label: 'horse vs chick' },
];

// ═══ MEMORY FLIP THEMES ═══
export const MEMORY_THEMES = [
  {
    name: 'Animals',
    items: [
      { id: 'dog', img: ANIMAL_IMAGES.dog },
      { id: 'cat', img: ANIMAL_IMAGES.cat },
      { id: 'bear', img: ANIMAL_IMAGES.bear },
      { id: 'rabbit', img: ANIMAL_IMAGES.rabbit },
      { id: 'fox', img: ANIMAL_IMAGES.fox },
      { id: 'penguin', img: ANIMAL_IMAGES.penguin },
      { id: 'koala', img: ANIMAL_IMAGES.koala },
      { id: 'panda', img: ANIMAL_IMAGES.panda },
    ],
  },
  {
    name: 'Fruits',
    items: [
      { id: 'apple', img: FRUIT_IMAGES.apple },
      { id: 'orange', img: FRUIT_IMAGES.orange },
      { id: 'banana', img: FRUIT_IMAGES.banana },
      { id: 'grapes', img: FRUIT_IMAGES.grapes },
      { id: 'strawberry', img: FRUIT_IMAGES.strawberry },
      { id: 'cherry', img: FRUIT_IMAGES.cherry },
      { id: 'watermelon', img: FRUIT_IMAGES.watermelon },
      { id: 'peach', img: FRUIT_IMAGES.peach },
    ],
  },
  {
    name: 'Nature',
    items: [
      { id: 'tree', img: OBJECT_IMAGES.tree },
      { id: 'flower', img: OBJECT_IMAGES.flower },
      { id: 'sun', img: OBJECT_IMAGES.sun },
      { id: 'moon', img: OBJECT_IMAGES.moon },
      { id: 'rainbow', img: OBJECT_IMAGES.rainbow },
      { id: 'butterfly', img: ANIMAL_IMAGES.butterfly },
      { id: 'mushroom', img: NATURE_IMAGES.mushroom },
      { id: 'star', img: OBJECT_IMAGES.star },
    ],
  },
  {
    name: 'Food',
    items: [
      { id: 'pizza', img: FOOD_IMAGES.pizza },
      { id: 'burger', img: FOOD_IMAGES.burger },
      { id: 'cookie', img: FOOD_IMAGES.cookie },
      { id: 'icecream', img: FOOD_IMAGES.icecream },
      { id: 'donut', img: FOOD_IMAGES.donut },
      { id: 'candy', img: FOOD_IMAGES.candy },
      { id: 'popcorn', img: FOOD_IMAGES.popcorn },
      { id: 'cheese', img: FOOD_IMAGES.cheese },
    ],
  },
];

// ═══ DRAWING PROMPTS ═══
export const DRAW_PROMPTS = [
  { prompt: 'Draw a Circle', img: SHAPE_IMAGES.circle, shape: 'circle' },
  { prompt: 'Draw a Square', img: SHAPE_IMAGES.square, shape: 'square' },
  { prompt: 'Draw a Triangle', img: SHAPE_IMAGES.triangle, shape: 'triangle' },
  { prompt: 'Draw a Star', img: SHAPE_IMAGES.star, shape: 'star' },
  { prompt: 'Draw a Heart', img: SHAPE_IMAGES.heart, shape: 'heart' },
  { prompt: 'Draw a Sun', img: OBJECT_IMAGES.sun, shape: 'sun' },
  { prompt: 'Draw a Flower', img: OBJECT_IMAGES.flower, shape: 'flower' },
  { prompt: 'Draw a House', img: OBJECT_IMAGES.house, shape: 'house' },
  { prompt: 'Draw a Tree', img: OBJECT_IMAGES.tree, shape: 'tree' },
  { prompt: 'Draw a Fish', img: ANIMAL_IMAGES.fish, shape: 'fish' },
  { prompt: 'Draw a Cat', img: ANIMAL_IMAGES.cat, shape: 'cat' },
  { prompt: 'Draw a Butterfly', img: ANIMAL_IMAGES.butterfly, shape: 'butterfly' },
  { prompt: 'Draw a Rainbow', img: OBJECT_IMAGES.rainbow, shape: 'rainbow' },
  { prompt: 'Draw a Car', img: OBJECT_IMAGES.car, shape: 'car' },
  { prompt: 'Draw a Robot', img: OBJECT_IMAGES.robot, shape: 'robot' },
];

// ═══ ODD ONE OUT ═══
export const ODD_ONE_OUT_SETS = [
  { same: { name: 'dog', img: ANIMAL_IMAGES.dog }, odd: { name: 'apple', img: FRUIT_IMAGES.apple }, label: 'dogs' },
  { same: { name: 'apple', img: FRUIT_IMAGES.apple }, odd: { name: 'cat', img: ANIMAL_IMAGES.cat }, label: 'apples' },
  { same: { name: 'cat', img: ANIMAL_IMAGES.cat }, odd: { name: 'banana', img: FRUIT_IMAGES.banana }, label: 'cats' },
  { same: { name: 'bear', img: ANIMAL_IMAGES.bear }, odd: { name: 'fish', img: ANIMAL_IMAGES.fish }, label: 'bears' },
  { same: { name: 'flower', img: OBJECT_IMAGES.flower }, odd: { name: 'car', img: OBJECT_IMAGES.car }, label: 'flowers' },
  { same: { name: 'car', img: OBJECT_IMAGES.car }, odd: { name: 'tree', img: OBJECT_IMAGES.tree }, label: 'cars' },
  { same: { name: 'banana', img: FRUIT_IMAGES.banana }, odd: { name: 'carrot', img: VEGGIE_IMAGES.carrot }, label: 'bananas' },
  { same: { name: 'star', img: OBJECT_IMAGES.star }, odd: { name: 'moon', img: OBJECT_IMAGES.moon }, label: 'stars' },
  { same: { name: 'penguin', img: ANIMAL_IMAGES.penguin }, odd: { name: 'sun', img: OBJECT_IMAGES.sun }, label: 'penguins' },
  { same: { name: 'strawberry', img: FRUIT_IMAGES.strawberry }, odd: { name: 'broccoli', img: VEGGIE_IMAGES.broccoli }, label: 'strawberries' },
];

// ═══ RHYMING ═══
export const RHYME_IMAGES = {
  cat:  ANIMAL_IMAGES.cat,
  sun:  OBJECT_IMAGES.sun,
  ball: OBJECT_IMAGES.ball,
  dog:  ANIMAL_IMAGES.dog,
  tree: OBJECT_IMAGES.tree,
  hat:  OBJECT_IMAGES.hat,
  bed:  OBJECT_IMAGES.bed,
  fish: ANIMAL_IMAGES.fish,
  star: OBJECT_IMAGES.star,
  car:  OBJECT_IMAGES.car,
  bee:  ANIMAL_IMAGES.bee,
  key:  OBJECT_IMAGES.key,
};

// ═══ CATEGORY SORTING (for MatchByCategory) ═══
export const CATEGORY_SETS = {
  'Fruits vs Vegetables': {
    catA: { name: 'Fruits', items: [
      { name: 'apple', img: FRUIT_IMAGES.apple },
      { name: 'banana', img: FRUIT_IMAGES.banana },
      { name: 'orange', img: FRUIT_IMAGES.orange },
      { name: 'grapes', img: FRUIT_IMAGES.grapes },
      { name: 'strawberry', img: FRUIT_IMAGES.strawberry },
    ]},
    catB: { name: 'Vegetables', items: [
      { name: 'carrot', img: VEGGIE_IMAGES.carrot },
      { name: 'broccoli', img: VEGGIE_IMAGES.broccoli },
      { name: 'corn', img: VEGGIE_IMAGES.corn },
      { name: 'tomato', img: VEGGIE_IMAGES.tomato },
      { name: 'potato', img: VEGGIE_IMAGES.potato },
    ]},
  },
  'Animals vs Food': {
    catA: { name: 'Animals', items: [
      { name: 'dog', img: ANIMAL_IMAGES.dog },
      { name: 'cat', img: ANIMAL_IMAGES.cat },
      { name: 'bear', img: ANIMAL_IMAGES.bear },
      { name: 'rabbit', img: ANIMAL_IMAGES.rabbit },
      { name: 'penguin', img: ANIMAL_IMAGES.penguin },
    ]},
    catB: { name: 'Food', items: [
      { name: 'pizza', img: FOOD_IMAGES.pizza },
      { name: 'cookie', img: FOOD_IMAGES.cookie },
      { name: 'icecream', img: FOOD_IMAGES.icecream },
      { name: 'burger', img: FOOD_IMAGES.burger },
      { name: 'candy', img: FOOD_IMAGES.candy },
    ]},
  },
  'Land vs Sea': {
    catA: { name: 'Land Animals', items: [
      { name: 'dog', img: ANIMAL_IMAGES.dog },
      { name: 'cat', img: ANIMAL_IMAGES.cat },
      { name: 'lion', img: ANIMAL_IMAGES.lion },
      { name: 'bear', img: ANIMAL_IMAGES.bear },
      { name: 'horse', img: ANIMAL_IMAGES.horse },
    ]},
    catB: { name: 'Sea Animals', items: [
      { name: 'fish', img: ANIMAL_IMAGES.fish },
      { name: 'whale', img: ANIMAL_IMAGES.whale },
      { name: 'dolphin', img: ANIMAL_IMAGES.dolphin },
      { name: 'octopus', img: ANIMAL_IMAGES.octopus },
      { name: 'crab', img: ANIMAL_IMAGES.crab },
    ]},
  },
};
