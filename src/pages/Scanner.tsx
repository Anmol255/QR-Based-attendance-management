import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, ScanLine, CheckCircle2, AlertCircle, Camera } from 'lucide-react';

const Scanner = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<{ name: string; roll: string; status: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;

          try {
            const data = JSON.parse(decodedText);
            if (!data.studentId) throw new Error('Invalid QR code');

            // Fetch student
            const { data: student, error: fetchErr } = await supabase
              .from('students')
              .select('*')
              .eq('id', data.studentId)
              .single();

            if (fetchErr || !student) {
              toast.error('Student not found');
              setLastScanned({ name: 'Unknown', roll: 'N/A', status: 'error' });
              processingRef.current = false;
              return;
            }

            // Try to mark attendance (unique constraint prevents duplicates)
            const { error: insertErr } = await supabase
              .from('attendance')
              .insert({ student_id: student.id });

            if (insertErr) {
              if (insertErr.code === '23505') {
                toast.info(`${student.name} already marked present today`);
                setLastScanned({ name: student.name, roll: student.roll_number, status: 'duplicate' });
              } else {
                throw insertErr;
              }
            } else {
              toast.success(`${student.name} marked present!`);
              setLastScanned({ name: student.name, roll: student.roll_number, status: 'success' });
            }
          } catch (err: any) {
            toast.error(err.message || 'Scan error');
            setLastScanned(null);
          }

          setTimeout(() => { processingRef.current = false; }, 2000);
        },
        () => {} // ignore errors
      );

      setScanning(true);
    } catch (err) {
      toast.error('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground flex items-center gap-1 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h2 className="font-heading text-lg font-bold text-primary-foreground">AttendQR Scanner</h2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="shadow-[var(--shadow-medium)] border-border/50 mb-6">
          <CardHeader className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <ScanLine className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="font-heading text-xl">Scan Student QR</CardTitle>
            <p className="text-sm text-muted-foreground">Point camera at student's QR code to mark attendance</p>
          </CardHeader>
          <CardContent>
            <div id="qr-reader" className="rounded-xl overflow-hidden mb-4" />

            {!scanning ? (
              <Button onClick={startScanner} className="w-full" size="lg">
                <Camera className="w-5 h-5 mr-2" /> Start Scanner
              </Button>
            ) : (
              <Button onClick={stopScanner} variant="destructive" className="w-full" size="lg">
                Stop Scanner
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Last Scanned Result */}
        {lastScanned && (
          <Card className={`shadow-[var(--shadow-soft)] border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            lastScanned.status === 'success' ? 'ring-2 ring-success/30' : 
            lastScanned.status === 'duplicate' ? 'ring-2 ring-warning/30' : 'ring-2 ring-destructive/30'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {lastScanned.status === 'success' ? (
                  <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
                ) : lastScanned.status === 'duplicate' ? (
                  <AlertCircle className="w-8 h-8 text-warning shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
                )}
                <div>
                  <p className="font-heading font-semibold text-foreground">{lastScanned.name}</p>
                  <p className="text-sm text-muted-foreground">Roll: {lastScanned.roll}</p>
                </div>
                <Badge className={`ml-auto ${
                  lastScanned.status === 'success' ? 'bg-success' : 
                  lastScanned.status === 'duplicate' ? 'bg-warning' : 'bg-destructive'
                }`}>
                  {lastScanned.status === 'success' ? 'Marked!' : 
                   lastScanned.status === 'duplicate' ? 'Already Marked' : 'Error'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Scanner;
