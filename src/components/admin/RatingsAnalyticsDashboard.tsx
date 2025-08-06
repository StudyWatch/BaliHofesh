import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Star, Users, BookOpen, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// צבעים לגרפים
const COLORS = ["#6d28d9", "#3b82f6", "#22c55e", "#f59e42", "#f43f5e", "#6366f1", "#eab308"];
const PIE_COLORS = ["#22c55e", "#3b82f6", "#eab308", "#f59e42", "#f43f5e"];

// עוזר חישוב ממוצע
const average = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

const RatingsAnalyticsDashboard: React.FC = () => {
  // נתונים מה־DB
  const { data: lecturerReviews = [] } = useQuery({
    queryKey: ['lecturer_reviews'],
    queryFn: async () => {
      const { data } = await supabase.from('lecturer_reviews').select('*');
      return data || [];
    },
  });

  const { data: courseReviews = [] } = useQuery({
    queryKey: ['course_reviews'],
    queryFn: async () => {
      const { data } = await supabase.from('course_reviews').select('*');
      return data || [];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await supabase.from('courses').select('id, name_he');
      return data || [];
    },
  });

  const { data: lecturers = [] } = useQuery({
    queryKey: ['course_lecturers'],
    queryFn: async () => {
      const { data } = await supabase.from('course_lecturers').select('id, name');
      return data || [];
    },
  });

  // ===================== מרצים ======================
  // ממוצע לכל מרצה
  const lecturerAverages = useMemo(() => {
    const map: Record<string, { avg: number, count: number, name: string }> = {};
    lecturerReviews.forEach((r: any) => {
      if (!map[r.lecturer_id]) {
        map[r.lecturer_id] = { avg: 0, count: 0, name: "" };
      }
      map[r.lecturer_id].avg += r.rating;
      map[r.lecturer_id].count += 1;
    });
    Object.keys(map).forEach(id => {
      map[id].avg = map[id].avg / map[id].count;
      map[id].name = lecturers.find((l: any) => l.id === id)?.name || "מרצה לא ידוע";
    });
    return Object.entries(map).map(([id, val]) => ({
      id,
      name: val.name,
      avg: Number(val.avg.toFixed(2)),
      count: val.count,
    }));
  }, [lecturerReviews, lecturers]);

  // מרצים מובילים (דירוג גבוה + הרבה חוות דעת)
  const topLecturers = useMemo(
    () =>
      lecturerAverages
        .filter(l => l.count >= 3) // לפחות 3 ביקורות
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5),
    [lecturerAverages]
  );

  // מרצים עם דירוג נמוך
  const lowLecturers = useMemo(
    () =>
      lecturerAverages
        .filter(l => l.count >= 3)
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 3),
    [lecturerAverages]
  );

  // ===================== קורסים ======================
  const courseAverages = useMemo(() => {
    const map: Record<string, { avg: number, count: number, name: string }> = {};
    courseReviews.forEach((r: any) => {
      if (!map[r.course_id]) {
        map[r.course_id] = { avg: 0, count: 0, name: "" };
      }
      map[r.course_id].avg += r.rating;
      map[r.course_id].count += 1;
    });
    Object.keys(map).forEach(id => {
      map[id].avg = map[id].avg / map[id].count;
      map[id].name = courses.find((c: any) => c.id === id)?.name_he || "קורס לא ידוע";
    });
    return Object.entries(map).map(([id, val]) => ({
      id,
      name: val.name,
      avg: Number(val.avg.toFixed(2)),
      count: val.count,
    }));
  }, [courseReviews, courses]);

  // קורסים מובילים
  const topCourses = useMemo(
    () =>
      courseAverages
        .filter(c => c.count >= 4)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5),
    [courseAverages]
  );
  // קורסים חלשים
  const lowCourses = useMemo(
    () =>
      courseAverages
        .filter(c => c.count >= 4)
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 3),
    [courseAverages]
  );

  // ===================== אינדיקטורים מהירים ======================
  const overallLecturerAvg = average(lecturerAverages.map(l => l.avg));
  const overallCourseAvg = average(courseAverages.map(c => c.avg));
  const totalLecturerReviews = lecturerReviews.length;
  const totalCourseReviews = courseReviews.length;

  // ========== ציונים לפי קריטריונים (מרצים) ===========
  const teachingQualityAvg = average(lecturerReviews.map((r: any) => Number(r.teaching_quality || 0)));
  const availabilityAvg = average(lecturerReviews.map((r: any) => Number(r.lecturer_availability || 0)));
  const approachAvg = average(lecturerReviews.map((r: any) => Number(r.personal_approach || 0)));
  const criteriaData = [
    { name: "איכות הוראה", value: teachingQualityAvg },
    { name: "זמינות", value: availabilityAvg },
    { name: "יחס אישי", value: approachAvg },
  ];

  // ========== התפלגות דירוגים בקורסים ==========
  const ratingDistribution = [1,2,3,4,5].map(rating => ({
    rating,
    count: courseReviews.filter((r: any) => r.rating === rating).length
  }));

  return (
    <div className="space-y-8 p-2 md:p-6">
      <Card className="shadow-2xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-black text-blue-900">
            <TrendingUp className="w-7 h-7 text-green-600" />
            דשבורד סטטיסטיקות מערכת - חוות דעת מרצים וקורסים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-8 mb-8">
            <IndicatorBox value={totalLecturerReviews} label="סה״כ ביקורות מרצים" color="purple" />
            <IndicatorBox value={totalCourseReviews} label="סה״כ ביקורות קורסים" color="blue" />
            <IndicatorBox value={overallLecturerAvg.toFixed(2)} label="ממוצע מרצים" color="green" />
            <IndicatorBox value={overallCourseAvg.toFixed(2)} label="ממוצע קורסים" color="orange" />
            <IndicatorBox value={teachingQualityAvg.toFixed(2)} label="איכות הוראה" color="blue" />
            <IndicatorBox value={availabilityAvg.toFixed(2)} label="זמינות" color="blue" />
            <IndicatorBox value={approachAvg.toFixed(2)} label="יחס אישי" color="blue" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* טופ מרצים */}
            <TopList
              title="מרצים מובילים"
              icon={<Star className="text-yellow-500" />}
              list={topLecturers}
              nameColor="text-blue-900"
              avgColor="bg-green-100 text-green-700"
            />
            {/* טופ קורסים */}
            <TopList
              title="קורסים מובילים"
              icon={<BookOpen className="text-blue-400" />}
              list={topCourses}
              nameColor="text-purple-900"
              avgColor="bg-orange-100 text-orange-700"
            />
            {/* התפלגות דירוגים */}
            <div>
              <div className="text-lg font-bold mb-2 flex items-center gap-2">
                <TrendingDown className="text-red-500" />התפלגות דירוגי קורסים
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="rating" fontSize={12} />
                  <YAxis allowDecimals={false} width={30} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* קריטריונים - Pie */}
          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div>
              <div className="font-bold mb-2 flex items-center gap-2">
                <Star className="text-blue-600" />ממוצע לפי קריטריונים במרצים
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={criteriaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {criteriaData.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <TopList
              title="מרצים עם הכי הרבה ביקורות"
              icon={<Users className="text-gray-500" />}
              list={lecturerAverages.sort((a, b) => b.count - a.count).slice(0, 5)}
              nameColor="text-blue-900"
              avgColor="bg-blue-100 text-blue-700"
              showCountOnly
            />
          </div>

          {/* קורסים/מרצים עם ממוצע נמוך */}
          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <TopList
              title="מרצים עם ממוצע נמוך"
              icon={<TrendingDown className="text-red-400" />}
              list={lowLecturers}
              nameColor="text-blue-900"
              avgColor="bg-red-100 text-red-700"
            />
            <TopList
              title="קורסים עם ממוצע נמוך"
              icon={<TrendingDown className="text-orange-500" />}
              list={lowCourses}
              nameColor="text-purple-900"
              avgColor="bg-red-100 text-red-700"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// קומפוננטות עזר
const IndicatorBox = ({ value, label, color }: { value: string | number, label: string, color: string }) => (
  <div className={`flex flex-col items-center`}>
    <span className={`text-xl font-bold text-${color}-700 dark:text-${color}-400`}>{value}</span>
    <span className="text-xs text-gray-500">{label}</span>
  </div>
);

const TopList = ({
  title,
  icon,
  list,
  nameColor,
  avgColor,
  showCountOnly = false,
}: {
  title: string;
  icon: React.ReactNode;
  list: any[];
  nameColor: string;
  avgColor: string;
  showCountOnly?: boolean;
}) => (
  <div>
    <div className="text-lg font-bold mb-2 flex items-center gap-2">{icon}{title}</div>
    <ul className="space-y-2">
      {list.map((item) => (
        <li key={item.id} className="flex items-center gap-2 border-b pb-1">
          <span className={`font-bold ${nameColor}`}>{item.name}</span>
          {showCountOnly ? (
            <Badge className={avgColor + " px-2"}>{item.count} ביקורות</Badge>
          ) : (
            <>
              <Badge className={avgColor + " px-2"}>{item.avg}★</Badge>
              <Badge className="bg-blue-100 text-blue-700 px-2">{item.count} ביקורות</Badge>
            </>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default RatingsAnalyticsDashboard;
