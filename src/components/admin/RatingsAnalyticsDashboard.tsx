import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Star, Users, BookOpen, TrendingUp, TrendingDown } from "lucide-react";
import { useRatingsAnalytics } from "@/hooks/useRatingsAnalytics";

// צבעים יפים לגרפים
const COLORS = ["#6d28d9", "#3b82f6", "#22c55e", "#f59e42", "#f43f5e", "#6366f1", "#eab308"];

// עוזר להוציא ממוצע
const average = (arr: number[]) =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

const RatingsAnalyticsDashboard: React.FC = () => {
  // כאן אתה מושך נתונים ב־hook משלך שמחזיר מערכים מהטבלאות (הפוך ל-React Query אם צריך)
  const { data: lecturerReviews = [] } = useLecturerReviews();      // טבלת lecturer_reviews
  const { data: courseReviews = [] } = useCourseReviews();          // טבלת course_reviews
  const { data: courses = [] } = useCourses();                      // טבלת courses
  const { data: lecturers = [] } = useCourseLecturers();            // טבלת course_lecturers

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
  const mostReviewedLecturer = lecturerAverages.reduce((max, l) => l.count > (max?.count || 0) ? l : max, null as any);
  const mostReviewedCourse = courseAverages.reduce((max, c) => c.count > (max?.count || 0) ? c : max, null as any);

  // ========== ציונים לפי קריטריונים (מרצים) ===========
  const teachingQualityAvg = average(lecturerReviews.map((r: any) => r.teaching_quality));
  const availabilityAvg = average(lecturerReviews.map((r: any) => r.lecturer_availability));
  const approachAvg = average(lecturerReviews.map((r: any) => r.personal_approach));
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

  // צבעים לפאי
  const pieColors = ["#22c55e", "#3b82f6", "#eab308", "#f59e42", "#f43f5e"];

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
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-purple-800">{totalLecturerReviews}</span>
              <span className="text-xs text-gray-500">סה״כ ביקורות מרצים</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-blue-700">{totalCourseReviews}</span>
              <span className="text-xs text-gray-500">סה״כ ביקורות קורסים</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-green-700">{overallLecturerAvg.toFixed(2)}</span>
              <span className="text-xs text-gray-500">ממוצע מרצים</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-orange-600">{overallCourseAvg.toFixed(2)}</span>
              <span className="text-xs text-gray-500">ממוצע קורסים</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-blue-600">{teachingQualityAvg.toFixed(2)}</span>
              <span className="text-xs text-gray-500">איכות הוראה</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-blue-600">{availabilityAvg.toFixed(2)}</span>
              <span className="text-xs text-gray-500">זמינות</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-blue-600">{approachAvg.toFixed(2)}</span>
              <span className="text-xs text-gray-500">יחס אישי</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* טופ מרצים */}
            <div>
              <div className="text-lg font-bold mb-2 flex items-center gap-2"><Star className="text-yellow-500" />מרצים מובילים</div>
              <ul className="space-y-2">
                {topLecturers.map(l => (
                  <li key={l.id} className="flex items-center gap-2 border-b pb-1">
                    <span className="font-bold text-blue-900">{l.name}</span>
                    <Badge className="bg-green-100 text-green-700 px-2">{l.avg}★</Badge>
                    <Badge className="bg-blue-100 text-blue-700 px-2">{l.count} ביקורות</Badge>
                  </li>
                ))}
              </ul>
            </div>
            {/* טופ קורסים */}
            <div>
              <div className="text-lg font-bold mb-2 flex items-center gap-2"><BookOpen className="text-blue-400" />קורסים מובילים</div>
              <ul className="space-y-2">
                {topCourses.map(c => (
                  <li key={c.id} className="flex items-center gap-2 border-b pb-1">
                    <span className="font-bold text-purple-900">{c.name}</span>
                    <Badge className="bg-orange-100 text-orange-700 px-2">{c.avg}★</Badge>
                    <Badge className="bg-blue-100 text-blue-700 px-2">{c.count} ביקורות</Badge>
                  </li>
                ))}
              </ul>
            </div>
            {/* התפלגות דירוגים */}
            <div>
              <div className="text-lg font-bold mb-2 flex items-center gap-2"><TrendingDown className="text-red-500" />התפלגות דירוגי קורסים</div>
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

          {/* פירוט קריטריונים - Pie */}
          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div>
              <div className="font-bold mb-2 flex items-center gap-2"><Star className="text-blue-600" />ממוצע לפי קריטריונים במרצים</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={criteriaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {criteriaData.map((entry, idx) => (
                      <Cell key={entry.name} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="font-bold mb-2 flex items-center gap-2"><Users className="text-gray-500" />מרצים עם הכי הרבה ביקורות</div>
              <ul className="space-y-2">
                {lecturerAverages
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map(l => (
                  <li key={l.id} className="flex items-center gap-2 border-b pb-1">
                    <span className="font-bold text-blue-900">{l.name}</span>
                    <Badge className="bg-blue-100 text-blue-700 px-2">{l.count} ביקורות</Badge>
                    <Badge className="bg-green-100 text-green-700 px-2">{l.avg}★</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* קורסים עם ממוצע נמוך */}
          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div>
              <div className="font-bold mb-2 flex items-center gap-2"><TrendingDown className="text-red-400" />מרצים עם ממוצע נמוך</div>
              <ul className="space-y-2">
                {lowLecturers.map(l => (
                  <li key={l.id} className="flex items-center gap-2 border-b pb-1">
                    <span className="font-bold text-blue-900">{l.name}</span>
                    <Badge className="bg-red-100 text-red-700 px-2">{l.avg}★</Badge>
                    <Badge className="bg-blue-100 text-blue-700 px-2">{l.count} ביקורות</Badge>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-bold mb-2 flex items-center gap-2"><TrendingDown className="text-orange-500" />קורסים עם ממוצע נמוך</div>
              <ul className="space-y-2">
                {lowCourses.map(c => (
                  <li key={c.id} className="flex items-center gap-2 border-b pb-1">
                    <span className="font-bold text-purple-900">{c.name}</span>
                    <Badge className="bg-red-100 text-red-700 px-2">{c.avg}★</Badge>
                    <Badge className="bg-blue-100 text-blue-700 px-2">{c.count} ביקורות</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RatingsAnalyticsDashboard;
