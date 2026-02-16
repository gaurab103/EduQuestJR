import ShapeMatchQuest from './ShapeMatchQuest';
import CountingAdventure from './CountingAdventure';
import PatternMaster from './PatternMaster';
import MemoryFlipArena from './MemoryFlipArena';
import AdditionIsland from './AdditionIsland';
import EmotionDetective from './EmotionDetective';
import OddOneOut from './OddOneOut';
import TapTheColor from './TapTheColor';
import BalloonPop from './BalloonPop';
import BlocklyCodingLab from './BlocklyCodingLab';
import SubtractionSafari from './SubtractionSafari';
import SequenceBuilder from './SequenceBuilder';
import ColorBasketSorting from './ColorBasketSorting';
import BigVsSmall from './BigVsSmall';
import MatchByCategory from './MatchByCategory';
import MissingNumber from './MissingNumber';
import MoreOrLess from './MoreOrLess';
import RhymingMatch from './RhymingMatch';
import OppositesMatch from './OppositesMatch';
import CalmBreathingBubble from './CalmBreathingBubble';
import CauseEffectTap from './CauseEffectTap';
import GoodBehaviorChoice from './GoodBehaviorChoice';
import TraceLetters from './TraceLetters';
import ColorInsideShape from './ColorInsideShape';
import StackBlocks from './StackBlocks';
import FillMissingLetter from './FillMissingLetter';
import DrawingCanvas from './DrawingCanvas';
import HandwritingHero from './HandwritingHero';
import SoundSafari from './SoundSafari';
import WordScramble from './WordScramble';
import SightWords from './SightWords';
import NumberBonds from './NumberBonds';
import ClockTime from './ClockTime';
import MoneyMath from './MoneyMath';
import ScienceSort from './ScienceSort';
import VocabMatch from './VocabMatch';
import SpellingBee from './SpellingBee';
import AlphabetBubblePop from './AlphabetBubblePop';
import LetterSoundMatch from './LetterSoundMatch';
import ABCOrder from './ABCOrder';
import StorySequence from './StorySequence';
import AnimalQuiz from './AnimalQuiz';
import ColorMixing from './ColorMixing';
import MazeRunner from './MazeRunner';
import BodyParts from './BodyParts';
import WeatherLearn from './WeatherLearn';
import MusicalNotes from './MusicalNotes';
import DotConnect from './DotConnect';
import EmotionMatch from './EmotionMatch';
import TimeSorter from './TimeSorter';
import PlantGrower from './PlantGrower';
import CompareWeight from './CompareWeight';
import DirectionQuest from './DirectionQuest';
import MatchShadow from './MatchShadow';
import NumberLine from './NumberLine';
import SyllableClap from './SyllableClap';
import SortBySize from './SortBySize';
import FingerTracePath from './FingerTracePath';
import ConnectTheStars from './ConnectTheStars';
import DragSortGame from './DragSortGame';
import AlphabetTracingWorld from './AlphabetTracingWorld';
// Premium-exclusive unique game components
import PhonicsBlendingLab from './PhonicsBlendingLab';
import DigitalColoringBook from './DigitalColoringBook';
import LogicGridJunior from './LogicGridJunior';
import WordBuilderPro from './WordBuilderPro';
import MusicRhythmTap from './MusicRhythmTap';
import MazeExplorer from './MazeExplorer';
import ShapeGeometryLab from './ShapeGeometryLab';
import StoryBuilderStudio from './StoryBuilderStudio';
import FractionFunLand from './FractionFunLand';
import MultiplicationTreasure from './MultiplicationTreasure';

export const GAME_COMPONENTS = {
  'shape-match-quest': ShapeMatchQuest,
  'counting-adventure': CountingAdventure,
  'pattern-master': PatternMaster,
  'memory-flip-arena': MemoryFlipArena,
  'odd-one-out': OddOneOut,
  'addition-island': AdditionIsland,
  'emotion-detective': EmotionDetective,
  'tap-the-color': TapTheColor,
  'balloon-pop': BalloonPop,
  'blockly-coding-lab': BlocklyCodingLab,
  'subtraction-safari': SubtractionSafari,
  'sequence-builder': SequenceBuilder,
  'shadow-match': MatchShadow,  // merged: both use MatchShadow (richer implementation)
  'color-basket-sorting': ColorBasketSorting,
  'big-vs-small': BigVsSmall,
  'match-by-category': MatchByCategory,
  'missing-number': MissingNumber,
  'more-or-less': MoreOrLess,
  'rhyming-match': RhymingMatch,
  'opposites-match': OppositesMatch,
  'calm-breathing-bubble': CalmBreathingBubble,
  'cause-effect-tap': CauseEffectTap,
  'good-behavior-choice': GoodBehaviorChoice,
  'trace-letters': TraceLetters,
  'color-inside-shape': ColorInsideShape,
  'stack-blocks': StackBlocks,
  'fill-missing-letter': FillMissingLetter,
  'drawing-canvas': DrawingCanvas,
  'handwriting-hero': HandwritingHero,
  'sound-safari': SoundSafari,
  'word-scramble': WordScramble,
  'sight-words': SightWords,
  'number-bonds': NumberBonds,
  'clock-time': ClockTime,
  'money-math': MoneyMath,
  'science-sort': ScienceSort,
  'vocab-match': VocabMatch,
  'spelling-bee': SpellingBee,
  'alphabet-bubble-pop': AlphabetBubblePop,
  'letter-sound-match': LetterSoundMatch,
  'abc-order': ABCOrder,
  'story-sequence': StorySequence,
  'animal-quiz': AnimalQuiz,
  'color-mixing': ColorMixing,
  'maze-runner': MazeRunner,
  'body-parts': BodyParts,
  'weather-learn': WeatherLearn,
  'musical-notes': MusicalNotes,
  'dot-connect': DotConnect,
  'emotion-match': EmotionMatch,
  'time-sorter': TimeSorter,
  'plant-grower': PlantGrower,
  'compare-weight': CompareWeight,
  'direction-quest': DirectionQuest,
  'match-shadow': MatchShadow,
  'number-line': NumberLine,
  'syllable-clap': SyllableClap,
  'sort-by-size': SortBySize,
  'finger-trace-path': FingerTracePath,
  'connect-the-stars': ConnectTheStars,
  'drag-sort-game': DragSortGame,
  // Premium-exclusive games — each is a UNIQUE component with its own mechanic
  'alphabet-tracing-world': AlphabetTracingWorld,
  'phonics-blending-lab': PhonicsBlendingLab,
  'digital-coloring-book': DigitalColoringBook,
  'logic-grid-junior': LogicGridJunior,
  'word-builder-pro': WordBuilderPro,
  'music-rhythm-tap': MusicRhythmTap,
  'maze-explorer': MazeExplorer,
  'shape-geometry-lab': ShapeGeometryLab,
  'story-builder-studio': StoryBuilderStudio,
  'fraction-fun-land': FractionFunLand,
  'multiplication-treasure': MultiplicationTreasure,
};
