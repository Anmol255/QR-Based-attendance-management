import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, CheckCircle2, XCircle, RefreshCw, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface StudentWithAttendance {
  id: string;
  name: string;
  roll_number: string;
  created_at: string;
  isPresent: boolean;
  markedAt?: string;
}

const Admin = () => {
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const { data: allStudents } = await supabase
      .from('students')
      .select('*')
      .order('roll_number');

    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);

    const attendanceMap = new Map(
      (todayAttendance || []).map(a => [a.student_id, a.marked_at])
    );

    setStudents(
      (allStudents || []).map(s => ({
        ...s,
        isPresent: attendanceMap.has(s.id),
        markedAt: attendanceMap.get(s.id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (studentId: string, studentName: string) => {
    try {
      // Delete attendance records first (foreign key)
      await supabase.from('attendance').delete().eq('student_id', studentId);
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
      toast.success(`${studentName} has been removed`);
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete student');
    }
  };

  const handleMarkPresent = async (studentId: string, studentName: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { error } = await supabase.from('attendance').insert({
        student_id: studentId,
        date: today,
      });
      if (error) {
        if (error.code === '23505') {
          toast.info(`${studentName} is already marked present today`);
        } else {
          throw error;
        }
        return;
      }
      toast.success(`${studentName} marked as present`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark attendance');
    }
  };

  const presentCount = students.filter(s => s.isPresent).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground flex items-center gap-1 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h2 className="font-heading text-lg font-bold text-primary-foreground">Admin Panel</h2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Students', value: students.length, icon: Users },
            { label: 'Present Today', value: presentCount, icon: CheckCircle2 },
            { label: 'Absent Today', value: students.length - presentCount, icon: XCircle },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="shadow-[var(--shadow-soft)] border-border/50">
              <CardContent className="pt-5 pb-4 text-center">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student List */}
        <Card className="shadow-[var(--shadow-medium)] border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">All Students</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students registered yet</p>
            ) : (
              <div className="space-y-2">
                {students.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.isPresent ? 'bg-success' : 'bg-destructive'}`} />
                      <div>
                        <p className="font-medium text-sm text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.roll_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.markedAt && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {new Date(s.markedAt).toLocaleTimeString()}
                        </span>
                      )}
                      <Badge variant={s.isPresent ? 'default' : 'destructive'} className={s.isPresent ? 'bg-success' : ''}>
                        {s.isPresent ? 'Present' : 'Absent'}
                      </Badge>

                      {/* Mark Present Button */}
                      {!s.isPresent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                          onClick={() => handleMarkPresent(s.id, s.name)}
                          title="Mark Present"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Delete Button with Confirmation */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {s.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove {s.name} ({s.roll_number}) and all their attendance records. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(s.id, s.name)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
