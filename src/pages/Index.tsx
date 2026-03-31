import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, QrCode, ScanLine, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNumber.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Check if student already exists
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('roll_number', rollNumber.trim())
        .maybeSingle();

      if (existing) {
        navigate(`/dashboard/${existing.id}`);
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .insert({ name: name.trim(), roll_number: rollNumber.trim() })
        .select()
        .single();

      if (error) throw error;
      toast.success('Registration successful!');
      navigate(`/dashboard/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <nav className="flex justify-between items-center mb-16">
            <h2 className="font-heading text-xl font-bold text-primary-foreground">AttendQR</h2>
            <div className="flex gap-3">
              <Link to="/scanner">
                <Button variant="outline" size="sm" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <ScanLine className="w-4 h-4 mr-1" /> Scanner
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline" size="sm" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <Shield className="w-4 h-4 mr-1" /> Admin
                </Button>
              </Link>
            </div>
          </nav>
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-primary-foreground mb-4 tracking-tight">
              Smart Attendance
              <span className="block text-primary mt-1">Made Simple</span>
            </h1>
            <p className="text-primary-foreground/70 text-lg mb-8">
              Register once, get your unique QR code, and track attendance effortlessly.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 -mt-12 relative z-10 mb-16">
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
          {[
            { icon: UserPlus, title: 'Register', desc: 'Enter name & roll number' },
            { icon: QrCode, title: 'Get QR Code', desc: 'Unique code per student' },
            { icon: ScanLine, title: 'Scan & Track', desc: 'Instant attendance marking' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="text-center shadow-[var(--shadow-soft)] border-border/50" style={{ background: 'var(--gradient-card)' }}>
              <CardContent className="pt-6 pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Registration Form */}
        <Card className="max-w-md mx-auto shadow-[var(--shadow-medium)] border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">Student Registration</CardTitle>
            <CardDescription>Enter your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Student Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll">Roll Number</Label>
                <Input
                  id="roll"
                  placeholder="CS2024001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  maxLength={50}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Register & Get QR Code'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
