import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Hash, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  roll_number: string;
  created_at: string;
}

interface Attendance {
  id: string;
  marked_at: string;
  date: string;
}

const Dashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const [{ data: s }, { data: a }] = await Promise.all([
        supabase.from('students').select('*').eq('id', id).single(),
        supabase.from('attendance').select('*').eq('student_id', id).order('date', { ascending: false }),
      ]);
      setStudent(s);
      setAttendance(a || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-heading text-xl">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">Student not found</p>
            <Link to="/"><Button>Go Home</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find(a => a.date === today);
  const isPresent = !!todayAttendance;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground flex items-center gap-1 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h2 className="font-heading text-lg font-bold text-primary-foreground">AttendQR</h2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Student Info */}
        <Card className="shadow-[var(--shadow-medium)] border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Student Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold text-foreground">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Hash className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="font-semibold text-foreground">{student.roll_number}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Status */}
        <Card className={`shadow-[var(--shadow-soft)] border-border/50 mb-6 ${isPresent ? 'ring-2 ring-success/30' : ''}`}>
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPresent ? (
                <CheckCircle2 className="w-8 h-8 text-success" />
              ) : (
                <XCircle className="w-8 h-8 text-destructive" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Today's Status</p>
                <p className="font-heading font-semibold text-lg text-foreground">
                  {isPresent ? 'Present' : 'Absent'}
                </p>
              </div>
            </div>
            <Badge variant={isPresent ? 'default' : 'destructive'} className={isPresent ? 'bg-success' : ''}>
              {isPresent ? 'Marked' : 'Not Marked'}
            </Badge>
          </CardContent>
          {todayAttendance && (
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Marked at {new Date(todayAttendance.marked_at).toLocaleTimeString()}
              </div>
            </CardContent>
          )}
        </Card>

        {/* QR Code */}
        <Card className="shadow-[var(--shadow-medium)] border-border/50 mb-6">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-lg">Your QR Code</CardTitle>
            <p className="text-sm text-muted-foreground">Show this to your teacher for attendance</p>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <div className="p-6 bg-card rounded-2xl shadow-[var(--shadow-soft)] border border-border/30">
              <QRCodeSVG
                value={JSON.stringify({ studentId: student.id, rollNumber: student.roll_number })}
                size={200}
                level="H"
                fgColor="hsl(220, 25%, 10%)"
                bgColor="transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        {attendance.length > 0 && (
          <Card className="shadow-[var(--shadow-soft)] border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendance.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium text-foreground">{new Date(a.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(a.marked_at).toLocaleTimeString()}</span>
                      <Badge variant="default" className="bg-success text-xs">Present</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
