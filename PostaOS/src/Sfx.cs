using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace MatriciOS
{
    // Suoni sintetizzati in memoria (nessun file esterno): click, bip, fanfare in stile vecchio terminale
    static class Sfx
    {
        [DllImport("winmm.dll")] static extern bool PlaySound(IntPtr data, IntPtr hmod, uint flags);
        const uint ASYNC = 0x0001, NODEFAULT = 0x0002, MEMORY = 0x0004;
        const int SR = 22050;

        public static bool On = true;
        static readonly Dictionary<string, GCHandle> bank = new Dictionary<string, GCHandle>();
        static readonly Random rnd = new Random(7);
        static int lastTick;

        const int SQ = 0, TRI = 1, SAW = 2, NOISE = 3;

        public static void Init()
        {
            try
            {
                List<float> b;
                b = new List<float>(); Tone(b, 0, 0, 0.005, 0.20, NOISE, 6); Make("tick", b);
                b = new List<float>(); Tone(b, 0, 0, 0.010, 0.28, NOISE, 5); Tone(b, 1800, 1800, 0.006, 0.08, SQ, 3); Make("key", b);
                b = new List<float>(); Tone(b, 1046, 1046, 0.030, 0.10, SQ, 3); Make("move", b);
                b = new List<float>(); Tone(b, 784, 784, 0.035, 0.12, SQ, 1); Tone(b, 1175, 1175, 0.060, 0.12, SQ, 3); Make("select", b);
                b = new List<float>(); Tone(b, 659, 659, 0.07, 0.13, SQ, 1); Tone(b, 880, 880, 0.07, 0.13, SQ, 1); Tone(b, 1319, 1319, 0.16, 0.13, SQ, 4); Make("ok", b);
                b = new List<float>(); Tone(b, 196, 130, 0.32, 0.20, SAW, 1.2); Make("bad", b);
                b = new List<float>(); Tone(b, 247, 247, 0.06, 0.13, SQ, 1); Gap(b, 0.04); Tone(b, 247, 247, 0.06, 0.13, SQ, 1); Make("deny", b);
                b = new List<float>(); Tone(b, 1397, 1397, 0.05, 0.22, TRI, 2); Gap(b, 0.03); Tone(b, 1760, 1760, 0.07, 0.22, TRI, 3); Make("hint", b);
                b = new List<float>(); Tone(b, 0, 0, 0.045, 0.10, NOISE, 4); Tone(b, 900, 300, 0.04, 0.10, TRI, 2); Make("page", b);
                b = new List<float>(); Tone(b, 55, 440, 0.70, 0.10, SQ, 0.3); Tone(b, 0, 0, 0.06, 0.12, NOISE, 3); Tone(b, 1000, 1000, 0.12, 0.25, TRI, 2); Gap(b, 0.05); Tone(b, 1500, 1500, 0.08, 0.20, TRI, 3); Make("boot", b);
                b = new List<float>(); Tone(b, 523, 523, 0.09, 0.12, SQ, 1); Tone(b, 659, 659, 0.09, 0.12, SQ, 1); Tone(b, 784, 784, 0.09, 0.12, SQ, 1); Gap(b, 0.03); Tone(b, 1047, 1047, 0.32, 0.14, SQ, 3); Make("win", b);
                b = new List<float>(); Tone(b, 880, 880, 0.05, 0.25, TRI, 1); Tone(b, 1175, 1175, 0.05, 0.25, TRI, 1); Tone(b, 1760, 1760, 0.14, 0.25, TRI, 3); Tone(b, 2349, 2349, 0.18, 0.18, TRI, 4); Make("streak", b);
                b = new List<float>(); Tone(b, 440, 40, 0.50, 0.12, SQ, 1); Make("off", b);
            }
            catch { }
        }

        public static void Play(string name)
        {
            if (!On || Term.Dry) return;
            GCHandle h;
            if (!bank.TryGetValue(name, out h)) return;
            try { PlaySound(h.AddrOfPinnedObject(), IntPtr.Zero, ASYNC | NODEFAULT | MEMORY); } catch { }
        }

        public static void Tick()
        {
            int t = Environment.TickCount;
            if (t - lastTick < 30) return;
            lastTick = t;
            Play("tick");
        }

        static void Make(string name, List<float> s)
        {
            byte[] wav = Wav(s);
            bank[name] = GCHandle.Alloc(wav, GCHandleType.Pinned);  // fissato in memoria: PlaySound asincrono lo legge in seguito
        }

        static void Gap(List<float> b, double dur)
        {
            int n = (int)(dur * SR);
            for (int i = 0; i < n; i++) b.Add(0f);
        }

        static void Tone(List<float> b, double f0, double f1, double dur, double vol, int wave, double decay)
        {
            int n = (int)(dur * SR);
            double ph = 0, fade = SR * 0.002;
            for (int i = 0; i < n; i++)
            {
                double t = (double)i / n;
                double f = f0 + (f1 - f0) * t;
                ph += f / SR; ph -= Math.Floor(ph);
                double v;
                switch (wave)
                {
                    case SQ: v = ph < 0.5 ? 1 : -1; break;
                    case TRI: v = 4 * Math.Abs(ph - 0.5) - 1; break;
                    case SAW: v = 2 * ph - 1; break;
                    default: v = rnd.NextDouble() * 2 - 1; break;
                }
                double env = Math.Exp(-decay * t);
                double edge = Math.Min(1.0, Math.Min(i / fade, (n - i) / fade));
                b.Add((float)(v * vol * env * edge));
            }
        }

        static byte[] Wav(List<float> s)
        {
            var ms = new MemoryStream();
            var w = new BinaryWriter(ms);
            int data = s.Count * 2;
            w.Write(Encoding.ASCII.GetBytes("RIFF")); w.Write(36 + data); w.Write(Encoding.ASCII.GetBytes("WAVE"));
            w.Write(Encoding.ASCII.GetBytes("fmt ")); w.Write(16); w.Write((short)1); w.Write((short)1);
            w.Write(SR); w.Write(SR * 2); w.Write((short)2); w.Write((short)16);
            w.Write(Encoding.ASCII.GetBytes("data")); w.Write(data);
            foreach (float f in s)
            {
                float c = Math.Max(-1f, Math.Min(1f, f));
                w.Write((short)(c * 32000));
            }
            w.Flush();
            return ms.ToArray();
        }
    }
}
