import { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Star,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Zap,
  Target,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
}

interface UserStats {
  total_points: number;
  current_level: number;
  daily_quizzes_completed: number;
  current_streak: number;
  longest_streak: number;
}

interface Achievement {
  id: string;
  achievement_name: string;
  achievement_description: string;
  badge_icon: string;
  points_awarded: number;
  earned_at: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-white/[0.06] rounded-lg ${className}`} />
  );
}

function SkeletonMetricCard() {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
      </div>
      <SkeletonBlock className="w-24 h-2.5 mb-3 rounded-full" />
      <SkeletonBlock className="w-20 h-7 mb-2" />
      <SkeletonBlock className="w-32 h-2 rounded-full" />
    </div>
  );
}

export function LiteracyGamificationPage() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    total_points: 0,
    current_level: 1,
    daily_quizzes_completed: 0,
    current_streak: 0,
    longest_streak: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    loadUserStats();
    loadAchievements();
    loadDailyQuiz();
  }, []);

  const loadUserStats = async () => {
    setStatsLoading(true);
    try {
      const [pointsRes, streakRes] = await Promise.all([
        supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle(),
        supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle(),
      ]);

      if (pointsRes.data) {
        setUserStats((prev) => ({
          ...prev,
          total_points: pointsRes.data.total_points,
          current_level: pointsRes.data.current_level,
          daily_quizzes_completed: pointsRes.data.daily_quizzes_completed,
        }));
      }

      if (streakRes.data) {
        setUserStats((prev) => ({
          ...prev,
          current_streak: streakRes.data.current_streak,
          longest_streak: streakRes.data.longest_streak,
        }));
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadDailyQuiz = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: pointsData } = await supabase
        .from('user_points')
        .select('last_quiz_date')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (pointsData?.last_quiz_date === today) {
        setQuizCompleted(true);
        return;
      }

      const { data: attemptedToday } = await supabase
        .from('user_quiz_attempts')
        .select('quiz_question_id')
        .eq('user_id', user?.id)
        .gte('completed_at', `${today}T00:00:00`)
        .limit(1);

      if (attemptedToday && attemptedToday.length > 0) {
        setQuizCompleted(true);
        return;
      }

      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true)
        .limit(100);

      if (!questions || questions.length === 0) return;

      const { data: attempted } = await supabase
        .from('user_quiz_attempts')
        .select('quiz_question_id')
        .eq('user_id', user?.id);

      const attemptedIds = attempted?.map((a) => a.quiz_question_id) || [];
      const availableQuestions = questions.filter(
        (q) => !attemptedIds.includes(q.id)
      );

      const questionsToUse = availableQuestions.length > 0 ? availableQuestions : questions;
      const randomQuestion = questionsToUse[Math.floor(Math.random() * questionsToUse.length)];

      setCurrentQuiz({
        ...randomQuestion,
        options: randomQuestion.options as unknown as string[],
      });
    } catch (error) {
      console.error('Error loading daily quiz:', error);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentQuiz || !user) return;

    setLoading(true);
    const correct = selectedAnswer === currentQuiz.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    try {
      await supabase.from('user_quiz_attempts').insert({
        user_id: user.id,
        quiz_question_id: currentQuiz.id,
        selected_answer: selectedAnswer,
        is_correct: correct,
        points_earned: correct ? currentQuiz.points : 0,
      });

      if (correct) {
        await updateUserPoints(currentQuiz.points);
        await updateStreak();
        await checkAchievements();
      }

      setQuizCompleted(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPoints = async (points: number) => {
    try {
      const { data: existing } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      const newTotalPoints = (existing?.total_points || 0) + points;
      const newLevel = Math.floor(newTotalPoints / 100) + 1;
      const dailyCount = existing?.last_quiz_date === today
        ? (existing.daily_quizzes_completed || 0) + 1
        : 1;

      if (existing) {
        await supabase
          .from('user_points')
          .update({
            total_points: newTotalPoints,
            current_level: newLevel,
            daily_quizzes_completed: dailyCount,
            last_quiz_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user?.id);
      } else {
        await supabase.from('user_points').insert({
          user_id: user?.id,
          total_points: newTotalPoints,
          current_level: newLevel,
          daily_quizzes_completed: dailyCount,
          last_quiz_date: today,
        });
      }

      loadUserStats();
    } catch (error) {
      console.error('Error updating user points:', error);
    }
  };

  const updateStreak = async () => {
    try {
      const { data: existing } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newStreak = 1;
      if (existing) {
        if (existing.last_activity_date === yesterday) {
          newStreak = existing.current_streak + 1;
        } else if (existing.last_activity_date === today) {
          newStreak = existing.current_streak;
        }

        const newLongestStreak = Math.max(newStreak, existing.longest_streak);

        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_activity_date: today,
            total_activities: (existing.total_activities || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user?.id);
      } else {
        await supabase.from('user_streaks').insert({
          user_id: user?.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          total_activities: 1,
        });
      }

      loadUserStats();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const checkAchievements = async () => {
    try {
      const { data: stats } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      const { data: existingAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_type')
        .eq('user_id', user?.id);

      const achievementTypes = new Set(existingAchievements?.map(a => a.achievement_type) || []);
      const newAchievements = [];

      if (!achievementTypes.has('first_quiz') && stats?.daily_quizzes_completed >= 1) {
        newAchievements.push({
          user_id: user?.id,
          achievement_type: 'first_quiz',
          achievement_name: 'First Steps',
          achievement_description: 'Completed your first quiz!',
          badge_icon: 'star',
          points_awarded: 50,
        });
      }

      if (!achievementTypes.has('streak_3') && streak?.current_streak >= 3) {
        newAchievements.push({
          user_id: user?.id,
          achievement_type: 'streak_3',
          achievement_name: 'On Fire',
          achievement_description: '3-day learning streak!',
          badge_icon: 'flame',
          points_awarded: 100,
        });
      }

      if (!achievementTypes.has('streak_7') && streak?.current_streak >= 7) {
        newAchievements.push({
          user_id: user?.id,
          achievement_type: 'streak_7',
          achievement_name: 'Week Warrior',
          achievement_description: '7-day learning streak!',
          badge_icon: 'trophy',
          points_awarded: 200,
        });
      }

      if (!achievementTypes.has('level_5') && stats?.current_level >= 5) {
        newAchievements.push({
          user_id: user?.id,
          achievement_type: 'level_5',
          achievement_name: 'Rising Star',
          achievement_description: 'Reached Level 5!',
          badge_icon: 'trending-up',
          points_awarded: 150,
        });
      }

      if (newAchievements.length > 0) {
        await supabase.from('user_achievements').insert(newAchievements);

        for (const achievement of newAchievements) {
          await updateUserPoints(achievement.points_awarded);
        }

        loadAchievements();
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 border border-emerald-500/[0.15]';
      case 'medium':
        return 'bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 border border-amber-500/[0.15]';
      case 'hard':
        return 'bg-red-500/[0.08] text-red-600 dark:text-red-400 border border-red-500/[0.15]';
      default:
        return 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-white/[0.07]';
    }
  };

  const getProgressToNextLevel = () => {
    const pointsInCurrentLevel = userStats.total_points % 100;
    return (pointsInCurrentLevel / 100) * 100;
  };

  const levelBenefits = [
    { level: 5, label: 'Rising Star badge', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/[0.08]', reached: userStats.current_level >= 5 },
    { level: 10, label: 'Master Learner badge', icon: Award, color: 'text-blue-500', bg: 'bg-blue-500/[0.08]', reached: userStats.current_level >= 10 },
    { level: 20, label: 'Financial Guru status', icon: GraduationCap, color: 'text-cyan-500', bg: 'bg-cyan-500/[0.08]', reached: userStats.current_level >= 20 },
  ];

  return (
    <div className="space-y-5">

      {/* Hero Card */}
      <div className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] via-transparent to-cyan-500/[0.04] pointer-events-none" />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/[0.10] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-500">
                Tools
              </span>
            </div>
            <h1 className="text-[26px] sm:text-[30px] font-bold text-gray-900 dark:text-white tracking-tight mb-1.5">
              Learning Challenge
            </h1>
            <p className="text-[14px] text-gray-500 dark:text-gray-400">
              Learn, compete, and master your finances
            </p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/[0.06] flex-shrink-0">
            <BookOpen className="w-10 h-10 text-blue-400/60" />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </>
        ) : (
          <>
            {/* Level */}
            <div className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-blue-500/[0.10] flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">
                  Level
                </p>
                <p className="text-[28px] font-bold text-gray-900 dark:text-white leading-none mb-3">
                  {userStats.current_level}
                </p>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">Progress</span>
                    <span className="text-[11px] font-semibold text-blue-500">{getProgressToNextLevel().toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${getProgressToNextLevel()}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Points */}
            <div className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-amber-500/[0.10] flex items-center justify-center mb-3">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">
                  Total Points
                </p>
                <p className="text-[28px] font-bold text-gray-900 dark:text-white leading-none mb-1">
                  {userStats.total_points}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500">pts earned</p>
              </div>
            </div>

            {/* Current Streak */}
            <div className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.04] to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-orange-500/[0.10] flex items-center justify-center mb-3">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">
                  Current Streak
                </p>
                <p className="text-[28px] font-bold text-gray-900 dark:text-white leading-none mb-1">
                  {userStats.current_streak}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500">
                  {userStats.current_streak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>

            {/* Quizzes Done */}
            <div className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/[0.10] flex items-center justify-center mb-3">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">
                  Quizzes Done
                </p>
                <p className="text-[28px] font-bold text-gray-900 dark:text-white leading-none mb-1">
                  {userStats.daily_quizzes_completed}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500">completed</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main two-column layout */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* LEFT: Daily Challenge */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            {/* Card Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/[0.10] flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                Daily Challenge
              </h2>
            </div>

            <div className="p-5 sm:p-6">
              {quizCompleted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-500/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white mb-2">
                    Challenge Complete!
                  </h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5 max-w-xs mx-auto">
                    You've completed today's quiz. Come back tomorrow for a new challenge!
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/[0.08] border border-orange-500/[0.12] text-orange-600 dark:text-orange-400 rounded-xl text-[13px] font-semibold">
                    <Flame className="w-4 h-4" />
                    Keep your streak going!
                  </div>
                </div>
              ) : currentQuiz ? (
                <div>
                  {/* Tags */}
                  <div className="flex items-center flex-wrap gap-2 mb-5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getDifficultyStyle(currentQuiz.difficulty)}`}>
                      {currentQuiz.difficulty.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/[0.08] text-blue-600 dark:text-blue-400 border border-blue-500/[0.15]">
                      {currentQuiz.category}
                    </span>
                    <span className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 border border-amber-500/[0.15]">
                      +{currentQuiz.points} points
                    </span>
                  </div>

                  {/* Question */}
                  <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white mb-5 leading-relaxed">
                    {currentQuiz.question}
                  </h3>

                  {/* Answer Options */}
                  <div className="space-y-2.5 mb-5">
                    {currentQuiz.options.map((option, index) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrectOption = option === currentQuiz.correct_answer;
                      const isWrongSelected = showResult && isSelected && !isCorrectOption;

                      let optionClass = 'border border-gray-200/80 dark:border-white/[0.07] bg-gray-50/80 dark:bg-white/[0.02] hover:border-blue-400/60 hover:bg-blue-500/[0.04] cursor-pointer';

                      if (showResult) {
                        if (isCorrectOption) {
                          optionClass = 'border border-emerald-500/30 bg-emerald-500/[0.06] cursor-default';
                        } else if (isWrongSelected) {
                          optionClass = 'border border-red-500/30 bg-red-500/[0.06] cursor-default';
                        } else {
                          optionClass = 'border border-gray-200/80 dark:border-white/[0.07] bg-gray-50/80 dark:bg-white/[0.02] opacity-50 cursor-default';
                        }
                      } else if (isSelected) {
                        optionClass = 'border border-blue-500/40 bg-blue-500/[0.06] cursor-pointer';
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => !showResult && setSelectedAnswer(option)}
                          disabled={showResult}
                          className={`w-full text-left p-4 rounded-xl transition-all duration-150 ${optionClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                showResult && isCorrectOption
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : isWrongSelected
                                  ? 'border-red-500 bg-red-500'
                                  : isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300 dark:border-white/[0.20]'
                              }`}
                            >
                              {showResult && isCorrectOption && (
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                              )}
                              {isWrongSelected && (
                                <XCircle className="w-3.5 h-3.5 text-white" />
                              )}
                              {!showResult && isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span className={`text-[14px] font-medium ${
                              showResult && isCorrectOption
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : isWrongSelected
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {option}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Result explanation */}
                  {showResult && (
                    <div className={`p-4 rounded-xl mb-5 ${
                      isCorrect
                        ? 'bg-emerald-500/[0.06] border border-emerald-500/[0.12]'
                        : 'bg-red-500/[0.06] border border-red-500/[0.12]'
                    }`}>
                      <p className={`text-[13px] font-semibold mb-1 ${
                        isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        {isCorrect ? 'Correct!' : 'Not quite right'}
                      </p>
                      <p className="text-[13px] text-gray-600 dark:text-gray-400">
                        {currentQuiz.explanation}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  {!showResult && (
                    <button
                      onClick={submitAnswer}
                      disabled={!selectedAnswer || loading}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold text-[14px] hover:opacity-90 transition-opacity shadow-sm shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Submitting...' : 'Submit Answer'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[13px] text-gray-400 dark:text-gray-500">Loading your challenge...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Achievements + Streak + Level Benefits */}
        <div className="space-y-4">

          {/* Recent Achievements */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/[0.10] flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                Recent Achievements
              </h3>
            </div>
            <div className="p-4">
              {achievements.length > 0 ? (
                <div className="space-y-2.5">
                  {achievements.slice(0, 5).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-start gap-3 p-3 bg-amber-500/[0.04] border border-amber-500/[0.10] rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/[0.12] flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                          {achievement.achievement_name}
                        </p>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400">
                          {achievement.achievement_description}
                        </p>
                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                          +{achievement.points_awarded} points
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/[0.08] flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-5 h-5 text-amber-400/60" />
                  </div>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500">
                    Complete challenges to earn achievements!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Streak Milestones */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/[0.10] flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                Streak Milestones
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between py-1">
                <span className="text-[13px] text-gray-500 dark:text-gray-400">Current Streak</span>
                <span className="text-[13px] font-bold text-orange-500">
                  {userStats.current_streak} {userStats.current_streak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[13px] text-gray-500 dark:text-gray-400">Longest Streak</span>
                <span className="text-[13px] font-bold text-blue-500">
                  {userStats.longest_streak} {userStats.longest_streak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-relaxed">
                  Keep learning daily to maintain your streak and unlock special rewards.
                </p>
              </div>
            </div>
          </div>

          {/* Level Benefits */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/[0.10] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                Level Benefits
              </h3>
            </div>
            <div className="p-4 space-y-2.5">
              {levelBenefits.map(({ level, label, icon: Icon, color, bg, reached }) => (
                <div
                  key={level}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    reached
                      ? 'bg-emerald-500/[0.04] border-emerald-500/[0.12]'
                      : 'bg-gray-50/80 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/[0.05]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${reached ? 'bg-emerald-500/[0.10]' : bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${reached ? 'text-emerald-500' : color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold ${reached ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-800 dark:text-gray-200'}`}>
                      Level {level}
                    </p>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">{label}</p>
                  </div>
                  {reached && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
