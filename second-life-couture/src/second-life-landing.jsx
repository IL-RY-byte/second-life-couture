import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Eye, Loader2, KeyRound, X, Info } from 'lucide-react';

export default function SecondLifeCouture() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInfoOpen, setKeyInfoOpen] = useState(false);
  const generatorRef = useRef(null);

  // Load API key from in-memory storage on mount (NO localStorage — not allowed in artifacts)
  // Key persists only during this session.

  const examplePrompts = [
    'Mystical botanical with sunflower mandala',
    'Geometric architecture and sacred symbols',
    'Ocean waves with moon phases',
    'Forest canopy and woodland creatures',
  ];

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateDesign = async (userPrompt) => {
    if (!apiKey.trim()) {
      setShowKeyModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedDesign(null);

    try {
      const systemInstruction = `You are a pattern designer for Second-Life Couture, an upcycled fashion brand. Generate a JSON design brief for a 3D-printable garment pattern. The pattern combines a central medallion (symbolic centerpiece) with surrounding botanical/decorative motifs.

Respond ONLY with valid JSON in this exact format (no markdown, no preamble, no code fences):
{
  "name": "Two-to-four word evocative name",
  "centerSymbol": "single word: eye, moon, sun, flame, star, leaf, or wave",
  "motifs": ["array", "of", "4-6", "botanical or symbolic motifs"],
  "palette": {
    "primary": "hex color string starting with #",
    "secondary": "hex color string starting with #",
    "name": "palette descriptive name"
  },
  "complexity": integer from 8 to 24,
  "narrative": "one poetic sentence describing the design meaning",
  "rilief": "subtle, moderate, or pronounced"
}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: `Design a pattern for: ${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let msg = `API error ${response.status}`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error?.message) msg = errJson.error.message;
        } catch (e) {}
        if (response.status === 400 && msg.toLowerCase().includes('api key')) {
          msg = 'Invalid API key. Check the key and try again.';
        }
        if (response.status === 403) {
          msg = 'API key rejected. Make sure Gemini API is enabled for this key.';
        }
        throw new Error(msg);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) throw new Error('Empty response from Gemini.');

      const cleaned = text.replace(/```json|```/g, '').trim();
      const design = JSON.parse(cleaned);

      // Validate required fields with fallbacks
      if (!design.centerSymbol) design.centerSymbol = 'eye';
      if (!design.palette) design.palette = { primary: '#B85042', secondary: '#8B6F47', name: 'Terracotta' };
      if (!design.complexity) design.complexity = 16;
      design.complexity = Math.max(8, Math.min(24, parseInt(design.complexity) || 16));

      setGeneratedDesign(design);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Generation failed. Try again or check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (prompt.trim() && !loading) {
      generateDesign(prompt.trim());
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2', color: '#2B2B2B' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Cormorant Garamond', serif; font-weight: 400; letter-spacing: -0.01em; }
        .font-italic { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400; }
        .grain {
          background-image: radial-gradient(circle at 1px 1px, rgba(43, 43, 43, 0.04) 1px, transparent 0);
          background-size: 4px 4px;
        }
        .reveal {
          opacity: 0;
          animation: reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rotate-slow {
          animation: spin 60s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* API key modal */}
      {showKeyModal && (
        <ApiKeyModal
          apiKey={apiKey}
          setApiKey={setApiKey}
          onClose={() => setShowKeyModal(false)}
          onConfirm={() => {
            setShowKeyModal(false);
            if (prompt.trim()) generateDesign(prompt.trim());
          }}
        />
      )}

      {/* Header */}
      <header className="border-b" style={{ borderColor: '#E7E2D8' }}>
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#B85042' }}
            >
              <Eye className="w-4 h-4" style={{ color: '#F5E6D3' }} />
            </div>
            <div>
              <div className="font-display text-lg leading-none">Second-Life</div>
              <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: '#6B6B6B' }}>
                Couture
              </div>
            </div>
          </div>
          <nav className="hidden md:flex gap-10 text-sm" style={{ color: '#6B6B6B' }}>
            <a href="#concept" className="hover:text-stone-900 transition-colors">The Concept</a>
            <a href="#designer" className="hover:text-stone-900 transition-colors">Design Studio</a>
            <a href="#how" className="hover:text-stone-900 transition-colors">How It Works</a>
            <a href="#shop" className="hover:text-stone-900 transition-colors">Shop</a>
          </nav>
          <button
            className="text-xs tracking-[0.2em] uppercase px-5 py-2.5 rounded-full transition-all hover:scale-105"
            style={{ backgroundColor: '#2B2B2B', color: '#FAF7F2' }}
          >
            €29 · First Drop
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-32 grain">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 reveal">
            <div className="text-xs tracking-[0.3em] uppercase mb-8" style={{ color: '#B85042' }}>
              ⬣ Collection 01 · The Eye of the Garden
            </div>
            <h1 className="font-display text-6xl md:text-8xl leading-[0.95] mb-8">
              A wardrobe
              <br />
              <span className="font-italic" style={{ color: '#B85042' }}>is an archive.</span>
              <br />
              We print
              <br />
              its memory.
            </h1>
            <p className="text-lg max-w-xl leading-relaxed mb-10" style={{ color: '#6B6B6B' }}>
              Upcycled second-hand garments meet Stratasys D2G 3D printing. Each piece carries a
              one-of-one botanical medallion — a tactile, mystical signature pressed directly into the
              textile. Scan the QR to read its story.
            </p>
            <div className="flex gap-4 items-center">
              <button
                onClick={scrollToGenerator}
                className="group flex items-center gap-3 px-7 py-4 rounded-full text-sm tracking-wide transition-all hover:gap-5"
                style={{ backgroundColor: '#B85042', color: '#FAF7F2' }}
              >
                <Sparkles className="w-4 h-4" />
                Design your own
                <ArrowRight className="w-4 h-4 transition-transform" />
              </button>
              <a href="#concept" className="text-sm underline underline-offset-4" style={{ color: '#2B2B2B' }}>
                See the collection
              </a>
            </div>
          </div>

          <div className="md:col-span-5 relative reveal" style={{ animationDelay: '0.3s' }}>
            <div className="relative aspect-square">
              <svg
                viewBox="0 0 400 400"
                className="absolute inset-0 w-full h-full rotate-slow"
                style={{ opacity: 0.15 }}
              >
                <circle cx="200" cy="200" r="195" fill="none" stroke="#2B2B2B" strokeWidth="0.5" strokeDasharray="2,4" />
                <circle cx="200" cy="200" r="170" fill="none" stroke="#B85042" strokeWidth="0.5" />
              </svg>
              <MedallionSVG />
            </div>
            <div className="absolute -bottom-6 -right-6 max-w-[220px] text-right">
              <div className="text-xs italic" style={{ color: '#6B6B6B' }}>
                "The garment remembers what its wearer forgets."
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase mt-2" style={{ color: '#B85042' }}>
                — Design 01 / 100
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONCEPT */}
      <section id="concept" className="border-y" style={{ borderColor: '#E7E2D8', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="grid md:grid-cols-12 gap-8 mb-16">
            <div className="md:col-span-4">
              <div className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#B85042' }}>
                ⬣ The Concept
              </div>
              <h2 className="font-display text-5xl leading-tight">
                Three garments.
                <br />
                <span className="font-italic">One signature.</span>
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 flex items-end">
              <p className="text-base leading-relaxed" style={{ color: '#6B6B6B' }}>
                The first collection lives across three pieces — T-shirt, shorts, sneakers. Each carries
                the same medallion, printed in copper-rust tones with surrounding botanical detail. The
                white base honors the garment's prior life. The 3D rilief makes it new again.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ProductCard name="The T-shirt" variant="tshirt" price="€29" detail="Cotton blend · medallion at chest · 6-min print" />
            <ProductCard name="The Shorts" variant="shorts" price="€32" detail="Athletic cut · medallion at hem · matched motif" />
            <ProductCard name="The Sneakers" variant="sneakers" price="€39" detail="Heel medallion · botanical wrap" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-7xl mx-auto px-8 py-24">
        <div className="grid md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-5">
            <div className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#B85042' }}>
              ⬣ How it works
            </div>
            <h2 className="font-display text-5xl leading-tight">
              Sourced,
              <br />
              <span className="font-italic">printed,</span>
              <br />
              passport-ready.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 space-y-6">
            <StepRow num="01" title="Source by weight" desc="A-grade second-hand denim, cotton, polyester or linen — sanitized, restored to ready state." />
            <StepRow num="02" title="Design your medallion" desc="Use our Gemini-powered studio (below) or browse curated drops. Each design is one-of-one." />
            <StepRow num="03" title="Print on J850 TechStyle" desc="Stratasys Direct-to-Garment UV-cured Elastico™ rilief — 6 minutes per piece." />
            <StepRow num="04" title="QR-tagged passport" desc="Scan to see prior owners, repair log, sustainability impact. Built for ESPR 2027." />
          </div>
        </div>
      </section>

      {/* DESIGN STUDIO */}
      <section
        id="designer"
        ref={generatorRef}
        className="border-y"
        style={{ borderColor: '#E7E2D8', backgroundColor: '#2B2B2B', color: '#FAF7F2' }}
      >
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-xs tracking-[0.3em] uppercase" style={{ color: '#D4A09A' }}>
                  ⬣ Design Studio · Powered by Gemini
                </div>
              </div>
              <h2 className="font-display text-5xl leading-tight mb-8">
                Describe it.
                <br />
                <span className="font-italic" style={{ color: '#D4A09A' }}>We design it.</span>
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: '#B8B5AE' }}>
                Tell us what should live at the center of your garment. Google's Gemini generates a
                complete design brief — symbol, motifs, palette, rilief depth — and we render it onto
                your future garment in real time.
              </p>

              {/* API key status */}
              <div className="mb-6 flex items-center gap-2">
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all hover:scale-105"
                  style={{
                    backgroundColor: apiKey ? '#3A5F4A' : '#4A4742',
                    color: apiKey ? '#D4F0DA' : '#D4A09A',
                  }}
                >
                  <KeyRound className="w-3 h-3" />
                  {apiKey ? 'API key set' : 'Set Gemini API key'}
                </button>
                <button
                  onClick={() => setKeyInfoOpen(!keyInfoOpen)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: '#4A4742', color: '#D4A09A' }}
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>

              {keyInfoOpen && (
                <div
                  className="mb-6 p-4 rounded-2xl text-xs leading-relaxed"
                  style={{ backgroundColor: '#3A3733', color: '#B8B5AE' }}
                >
                  <div className="mb-2" style={{ color: '#D4A09A' }}>
                    <strong>How to get a free Gemini API key:</strong>
                  </div>
                  <ol className="space-y-1 pl-4 list-decimal">
                    <li>Visit <span style={{ color: '#D4A09A' }}>aistudio.google.com/apikey</span></li>
                    <li>Sign in with Google → click "Create API key"</li>
                    <li>Paste it here. Free tier covers thousands of designs.</li>
                  </ol>
                  <div className="mt-3 italic" style={{ color: '#8A8580' }}>
                    Your key stays in your browser only — never sent to our servers.
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <label className="block text-xs tracking-[0.2em] uppercase" style={{ color: '#D4A09A' }}>
                  Your design intent
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. moon phases and ocean waves, mystical and meditative"
                  className="w-full p-5 rounded-2xl text-sm leading-relaxed bg-transparent border resize-none outline-none transition-all focus:border-stone-400"
                  style={{ borderColor: '#4A4742', color: '#FAF7F2', minHeight: '120px' }}
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !prompt.trim()}
                className="w-full flex items-center justify-center gap-3 px-7 py-4 rounded-full text-sm tracking-wide transition-all disabled:opacity-40"
                style={{ backgroundColor: '#B85042', color: '#FAF7F2' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Composing your design...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {apiKey ? 'Generate with Gemini' : 'Set key & generate'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-8">
                <div className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: '#8A8580' }}>
                  Or start from a prompt
                </div>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setPrompt(ex)}
                      disabled={loading}
                      className="text-xs px-3 py-2 rounded-full border transition-all hover:scale-105"
                      style={{ borderColor: '#4A4742', color: '#B8B5AE' }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-7">
              <DesignDisplay design={generatedDesign} loading={loading} error={error} />
            </div>
          </div>
        </div>
      </section>

      {/* SUSTAINABILITY */}
      <section className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <div className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#B85042' }}>
            ⬣ Impact per piece
          </div>
          <h2 className="font-display text-5xl">
            Quantified, <span className="font-italic">not declared.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <ImpactCard value="21.4 kg" label="CO₂eq saved" source="vs new denim · Ellen MacArthur 2023" />
          <ImpactCard value="7,500 L" label="water saved" source="per lifecycle · UNEP 2023" />
          <ImpactCard value="+5–7 yrs" label="lifecycle extension" source="WRAP UK study" />
        </div>
      </section>

      {/* SHOP CTA */}
      <section id="shop" className="border-t" style={{ borderColor: '#E7E2D8', backgroundColor: '#B85042', color: '#FAF7F2' }}>
        <div className="max-w-7xl mx-auto px-8 py-24 text-center">
          <div className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: '#F5E6D3' }}>
            ⬣ First drop · 2,000 pieces · June 2026
          </div>
          <h2 className="font-display text-7xl leading-tight mb-8">
            Reserve yours
            <br />
            <span className="font-italic">from €29.</span>
          </h2>
          <p className="text-base max-w-xl mx-auto mb-10" style={{ color: '#F5E6D3' }}>
            Pre-sale waitlist opens with limited slots. Your design intent goes into the production
            queue with Stratasys partners.
          </p>
          <button
            className="px-10 py-4 rounded-full text-sm tracking-[0.2em] uppercase transition-transform hover:scale-105"
            style={{ backgroundColor: '#FAF7F2', color: '#B85042' }}
          >
            Join the waitlist →
          </button>
        </div>
      </section>

      <footer className="py-12" style={{ backgroundColor: '#2B2B2B', color: '#8A8580' }}>
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-between gap-4 text-xs">
          <div>© 2026 Second-Life Couture · Berlin & Lisbon</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-stone-300 transition-colors">About</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Stratasys partnership</a>
            <a href="#" className="hover:text-stone-300 transition-colors">ESPR compliance</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── API KEY MODAL ──────────────────────────────────────────
function ApiKeyModal({ apiKey, setApiKey, onClose, onConfirm }) {
  const [localKey, setLocalKey] = useState(apiKey);

  const handleSave = () => {
    setApiKey(localKey.trim());
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(43, 43, 43, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full p-8 rounded-3xl relative"
        style={{ backgroundColor: '#FAF7F2', color: '#2B2B2B' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ backgroundColor: '#E7E2D8' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#B85042' }}>
          ⬣ Gemini API Key
        </div>
        <h3 className="font-display text-3xl leading-tight mb-4">
          Connect <span className="font-italic">your key.</span>
        </h3>
        <p className="text-sm leading-relaxed mb-6" style={{ color: '#6B6B6B' }}>
          Your Gemini API key stays in your browser. It's used only to generate your design brief — never
          stored on our servers.
        </p>

        <div className="mb-2 text-xs tracking-[0.2em] uppercase" style={{ color: '#B85042' }}>
          API Key
        </div>
        <input
          type="password"
          value={localKey}
          onChange={(e) => setLocalKey(e.target.value)}
          placeholder="AIza..."
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && localKey.trim() && handleSave()}
          className="w-full p-4 rounded-2xl border outline-none transition-all focus:border-rose-700 text-sm font-mono mb-6"
          style={{ borderColor: '#E7E2D8', backgroundColor: '#FFFFFF', color: '#2B2B2B' }}
        />

        <div className="text-xs mb-6 p-4 rounded-2xl" style={{ backgroundColor: '#F5F0E8', color: '#6B6B6B' }}>
          <strong style={{ color: '#B85042' }}>How to get one (free):</strong>
          <br />
          1. Visit <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: '#B85042' }}
          >aistudio.google.com/apikey</a>
          <br />
          2. Sign in → "Create API key"
          <br />
          3. Paste it above. Free tier is generous.
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 rounded-full text-sm transition-all hover:scale-105"
            style={{ backgroundColor: '#E7E2D8', color: '#2B2B2B' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!localKey.trim()}
            className="flex-1 px-5 py-3 rounded-full text-sm transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            style={{ backgroundColor: '#B85042', color: '#FAF7F2' }}
          >
            Save & generate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MEDALLION SVG ──────────────────────────────────────────
function MedallionSVG({ palette = { primary: '#B85042', secondary: '#8B6F47' }, complexity = 16, centerSymbol = 'eye' }) {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <radialGradient id="med-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5E6D3" />
          <stop offset="100%" stopColor="#E0CDB3" />
        </radialGradient>
        <linearGradient id="med-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.secondary} />
        </linearGradient>
      </defs>

      <g style={{ opacity: 0.35 }}>
        {Array.from({ length: complexity }).map((_, i) => {
          const angle = (i * 360) / complexity;
          return (
            <g key={i} transform={`rotate(${angle} 200 200)`}>
              <path d="M 200 60 Q 195 80 200 100 Q 205 80 200 60 Z" fill="#2B2B2B" opacity="0.6" />
              <ellipse cx="200" cy="80" rx="3" ry="8" fill="#2B2B2B" opacity="0.4" />
            </g>
          );
        })}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8 + 22.5;
          return (
            <g key={`leaf-${i}`} transform={`rotate(${angle} 200 200)`}>
              <path d="M 200 110 Q 195 125 200 140 Q 205 125 200 110 Z" fill="#2B2B2B" opacity="0.5" />
            </g>
          );
        })}
      </g>

      <circle cx="200" cy="200" r="85" fill="url(#med-bg)" stroke="url(#med-rim)" strokeWidth="3" />
      <circle cx="200" cy="200" r="78" fill="none" stroke="url(#med-rim)" strokeWidth="0.8" />

      {Array.from({ length: 20 }).map((_, i) => {
        const angle = ((i * 360) / 20) * (Math.PI / 180);
        const x = 200 + Math.cos(angle) * 72;
        const y = 200 + Math.sin(angle) * 72;
        return <circle key={`rivet-${i}`} cx={x} cy={y} r="1.5" fill={palette.primary} />;
      })}

      <g transform="translate(200 200)">
        <CenterSymbolLarge symbol={centerSymbol} palette={palette} />
      </g>
    </svg>
  );
}

function CenterSymbolLarge({ symbol, palette }) {
  if (symbol === 'eye')
    return (
      <>
        <ellipse cx="0" cy="0" rx="38" ry="22" fill="#FAF7F2" stroke="#2B2B2B" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="14" fill={palette.primary} />
        <circle cx="0" cy="0" r="6" fill="#2B2B2B" />
        <circle cx="-3" cy="-3" r="2" fill="#FAF7F2" />
        {[-30, -15, 0, 15, 30].map((angle) => (
          <line
            key={angle}
            x1={Math.cos((angle - 90) * Math.PI / 180) * 22}
            y1={Math.sin((angle - 90) * Math.PI / 180) * 22 - 5}
            x2={Math.cos((angle - 90) * Math.PI / 180) * 30}
            y2={Math.sin((angle - 90) * Math.PI / 180) * 30 - 5}
            stroke="#2B2B2B"
            strokeWidth="1.2"
          />
        ))}
      </>
    );
  if (symbol === 'sun')
    return (
      <>
        <circle cx="0" cy="0" r="22" fill={palette.primary} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30) * Math.PI / 180;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 28}
              y1={Math.sin(a) * 28}
              x2={Math.cos(a) * 42}
              y2={Math.sin(a) * 42}
              stroke={palette.primary}
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
      </>
    );
  if (symbol === 'moon')
    return (
      <>
        <circle cx="0" cy="0" r="32" fill={palette.primary} />
        <circle cx="10" cy="-5" r="28" fill="#F5E6D3" />
      </>
    );
  if (symbol === 'flame')
    return (
      <>
        <path d="M 0 -35 Q -18 -10 -12 15 Q 0 25 12 15 Q 18 -10 0 -35 Z" fill={palette.primary} />
        <path d="M 0 -25 Q -8 -5 -4 10 Q 0 15 4 10 Q 8 -5 0 -25 Z" fill={palette.secondary} />
      </>
    );
  if (symbol === 'leaf')
    return (
      <>
        <path d="M 0 -35 Q -25 -10 0 30 Q 25 -10 0 -35 Z" fill={palette.primary} />
        <line x1="0" y1="-35" x2="0" y2="30" stroke={palette.secondary} strokeWidth="1.5" />
      </>
    );
  if (symbol === 'star')
    return (
      <polygon
        points="0,-32 9.4,-9.9 32.6,-9.9 13.6,4.7 18.8,28.3 0,15.5 -18.8,28.3 -13.6,4.7 -32.6,-9.9 -9.4,-9.9"
        fill={palette.primary}
      />
    );
  if (symbol === 'wave')
    return (
      <>
        <path
          d="M -35 0 Q -25 -15 -15 0 T 5 0 T 25 0 T 35 0"
          fill="none"
          stroke={palette.primary}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M -30 12 Q -20 -3 -10 12 T 10 12 T 30 12"
          fill="none"
          stroke={palette.secondary}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </>
    );
  return null;
}

// ─── PRODUCT CARD ──────────────────────────────────────────
function ProductCard({ name, variant, price, detail }) {
  return (
    <div className="group">
      <div
        className="aspect-square rounded-3xl p-8 flex items-center justify-center mb-5 transition-all group-hover:scale-[1.02]"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {variant === 'tshirt' && <TshirtIllustration />}
          {variant === 'shorts' && <ShortsIllustration />}
          {variant === 'sneakers' && <SneakerIllustration />}
        </svg>
      </div>
      <div className="flex justify-between items-baseline mb-1">
        <h3 className="font-display text-xl">{name}</h3>
        <div className="text-sm" style={{ color: '#B85042' }}>{price}</div>
      </div>
      <div className="text-xs leading-relaxed" style={{ color: '#6B6B6B' }}>{detail}</div>
    </div>
  );
}

function TshirtIllustration() {
  return (
    <>
      <path
        d="M 90 70 L 60 100 L 70 140 L 95 130 L 95 230 L 205 230 L 205 130 L 230 140 L 240 100 L 210 70 L 180 60 Q 150 75 120 60 Z"
        fill="#FFFFFF"
        stroke="#2B2B2B"
        strokeWidth="1.5"
      />
      <path d="M 120 60 Q 150 75 180 60" fill="none" stroke="#2B2B2B" strokeWidth="1.5" />
      <g transform="translate(150 140)">
        <circle r="22" fill="#F5E6D3" stroke="#B85042" strokeWidth="1.5" />
        <ellipse rx="10" ry="6" fill="#FFFFFF" stroke="#2B2B2B" strokeWidth="0.8" />
        <circle r="4" fill="#B85042" />
        <circle r="1.5" fill="#2B2B2B" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45) * Math.PI / 180;
          return (
            <ellipse
              key={i}
              cx={Math.cos(a) * 30}
              cy={Math.sin(a) * 30}
              rx="2"
              ry="5"
              fill="#2B2B2B"
              opacity="0.3"
              transform={`rotate(${i * 45} ${Math.cos(a) * 30} ${Math.sin(a) * 30})`}
            />
          );
        })}
      </g>
    </>
  );
}

function ShortsIllustration() {
  return (
    <>
      <path
        d="M 70 80 L 70 220 L 130 220 L 145 130 L 160 220 L 220 220 L 220 80 L 145 75 Z"
        fill="#FFFFFF"
        stroke="#2B2B2B"
        strokeWidth="1.5"
      />
      <line x1="145" y1="75" x2="145" y2="130" stroke="#2B2B2B" strokeWidth="1" />
      {Array.from({ length: 10 }).map((_, i) => (
        <ellipse
          key={i}
          cx={75 + i * 15}
          cy={210}
          rx="3"
          ry="6"
          fill="#2B2B2B"
          opacity="0.25"
        />
      ))}
      <g transform="translate(200 200)">
        <circle r="14" fill="#F5E6D3" stroke="#B85042" strokeWidth="1.5" />
        <circle r="6" fill="#B85042" />
        <circle r="2" fill="#2B2B2B" />
      </g>
    </>
  );
}

function SneakerIllustration() {
  return (
    <>
      <path
        d="M 40 180 Q 40 140 90 130 L 180 110 Q 230 105 250 130 L 260 175 Q 260 195 240 200 L 60 200 Q 40 200 40 180 Z"
        fill="#FFFFFF"
        stroke="#2B2B2B"
        strokeWidth="1.5"
      />
      <path d="M 40 180 L 40 195 L 260 195 L 260 180" fill="#F0EDE4" stroke="#2B2B2B" strokeWidth="1" />
      {[140, 160, 180].map((x, i) => (
        <line key={i} x1={x} y1={130} x2={x + 15} y2={145} stroke="#2B2B2B" strokeWidth="1" />
      ))}
      <g transform="translate(80 170)">
        <circle r="18" fill="#F5E6D3" stroke="#B85042" strokeWidth="1.5" />
        <ellipse rx="8" ry="5" fill="#FFFFFF" stroke="#2B2B2B" strokeWidth="0.6" />
        <circle r="3" fill="#B85042" />
      </g>
      {Array.from({ length: 6 }).map((_, i) => (
        <ellipse
          key={i}
          cx={180 + i * 12}
          cy={170}
          rx="3"
          ry="7"
          fill="#2B2B2B"
          opacity="0.25"
          transform={`rotate(${i * 15} ${180 + i * 12} 170)`}
        />
      ))}
    </>
  );
}

function StepRow({ num, title, desc }) {
  return (
    <div className="flex gap-6 pb-6 border-b" style={{ borderColor: '#E7E2D8' }}>
      <div className="font-display text-2xl italic" style={{ color: '#B85042' }}>{num}</div>
      <div>
        <h3 className="font-medium text-base mb-1">{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: '#6B6B6B' }}>{desc}</p>
      </div>
    </div>
  );
}

function ImpactCard({ value, label, source }) {
  return (
    <div className="text-center p-10 rounded-3xl" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="font-display text-6xl mb-3" style={{ color: '#B85042' }}>{value}</div>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="text-xs italic" style={{ color: '#6B6B6B' }}>{source}</div>
    </div>
  );
}

function DesignDisplay({ design, loading, error }) {
  if (loading) {
    return (
      <div className="aspect-square rounded-3xl flex flex-col items-center justify-center p-12" style={{ backgroundColor: '#3A3733' }}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#D4A09A' }} />
        <div className="text-xs tracking-[0.3em] uppercase" style={{ color: '#D4A09A' }}>
          Composing your design...
        </div>
        <div className="text-xs mt-3" style={{ color: '#8A8580' }}>via Gemini 2.0 Flash</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-square rounded-3xl flex flex-col items-center justify-center p-12 border-2 border-dashed" style={{ borderColor: '#4A4742' }}>
        <div className="text-center max-w-md">
          <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D4A09A' }}>
            Something went wrong
          </div>
          <div className="text-sm" style={{ color: '#B8B5AE' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="aspect-square rounded-3xl flex flex-col items-center justify-center p-12 border-2 border-dashed" style={{ borderColor: '#4A4742' }}>
        <Sparkles className="w-10 h-10 mb-4" style={{ color: '#8A8580' }} />
        <div className="text-center max-w-xs">
          <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D4A09A' }}>
            Your design appears here
          </div>
          <div className="text-sm" style={{ color: '#8A8580' }}>
            Describe what should live at the center of your garment, and Gemini will compose a complete pattern brief.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-8" style={{ backgroundColor: '#FAF7F2', color: '#2B2B2B' }}>
      <div className="grid grid-cols-2 gap-8">
        <div className="aspect-square">
          <MedallionSVG
            palette={design.palette}
            complexity={design.complexity}
            centerSymbol={design.centerSymbol}
          />
        </div>
        <div className="flex flex-col">
          <div className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: '#B85042' }}>
            ⬣ Design generated
          </div>
          <h3 className="font-display text-3xl leading-tight mb-3">{design.name}</h3>
          <p className="text-sm italic mb-5" style={{ color: '#6B6B6B' }}>
            "{design.narrative}"
          </p>

          <div className="space-y-3 text-xs flex-1">
            <DesignSpec label="Center" value={design.centerSymbol} />
            <DesignSpec label="Motifs" value={design.motifs?.join(' · ')} />
            <DesignSpec label="Palette" value={design.palette?.name} />
            <DesignSpec label="Complexity" value={`${design.complexity} radial segments`} />
            <DesignSpec label="Rilief" value={design.rilief} />
          </div>

          <div className="flex gap-2 mt-6">
            <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-full text-xs" style={{ backgroundColor: '#2B2B2B', color: '#FAF7F2' }}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: design.palette?.primary }} />
              {design.palette?.primary}
            </div>
            <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-full text-xs" style={{ backgroundColor: '#2B2B2B', color: '#FAF7F2' }}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: design.palette?.secondary }} />
              {design.palette?.secondary}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t" style={{ borderColor: '#E7E2D8' }}>
        <div className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#B85042' }}>
          ⬣ On your garments
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MockupTile variant="tshirt" design={design} />
          <MockupTile variant="shorts" design={design} />
          <MockupTile variant="sneakers" design={design} />
        </div>
      </div>
    </div>
  );
}

function DesignSpec({ label, value }) {
  return (
    <div className="flex gap-3 items-baseline">
      <div className="tracking-[0.2em] uppercase w-16 shrink-0" style={{ color: '#B85042', fontSize: '9px' }}>
        {label}
      </div>
      <div style={{ color: '#2B2B2B' }} className="capitalize">{value}</div>
    </div>
  );
}

function MockupTile({ variant, design }) {
  return (
    <div className="aspect-square rounded-2xl p-4 relative" style={{ backgroundColor: '#FFFFFF' }}>
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {variant === 'tshirt' && (
          <>
            <path
              d="M 90 70 L 60 100 L 70 140 L 95 130 L 95 230 L 205 230 L 205 130 L 230 140 L 240 100 L 210 70 L 180 60 Q 150 75 120 60 Z"
              fill="#FFFFFF"
              stroke="#2B2B2B"
              strokeWidth="1.2"
            />
            <g transform="translate(150 140) scale(0.5)">
              <circle r="44" fill="#F5E6D3" stroke={design.palette?.primary || '#B85042'} strokeWidth="2.5" />
              <CenterSymbolMini symbol={design.centerSymbol} palette={design.palette} />
            </g>
          </>
        )}
        {variant === 'shorts' && (
          <>
            <path
              d="M 70 80 L 70 220 L 130 220 L 145 130 L 160 220 L 220 220 L 220 80 L 145 75 Z"
              fill="#FFFFFF"
              stroke="#2B2B2B"
              strokeWidth="1.2"
            />
            <line x1="145" y1="75" x2="145" y2="130" stroke="#2B2B2B" strokeWidth="0.8" />
            <g transform="translate(190 195) scale(0.3)">
              <circle r="44" fill="#F5E6D3" stroke={design.palette?.primary || '#B85042'} strokeWidth="2.5" />
              <CenterSymbolMini symbol={design.centerSymbol} palette={design.palette} />
            </g>
          </>
        )}
        {variant === 'sneakers' && (
          <>
            <path
              d="M 40 180 Q 40 140 90 130 L 180 110 Q 230 105 250 130 L 260 175 Q 260 195 240 200 L 60 200 Q 40 200 40 180 Z"
              fill="#FFFFFF"
              stroke="#2B2B2B"
              strokeWidth="1.2"
            />
            <path d="M 40 180 L 40 195 L 260 195 L 260 180" fill="#F0EDE4" stroke="#2B2B2B" strokeWidth="0.8" />
            <g transform="translate(85 165) scale(0.4)">
              <circle r="44" fill="#F5E6D3" stroke={design.palette?.primary || '#B85042'} strokeWidth="2.5" />
              <CenterSymbolMini symbol={design.centerSymbol} palette={design.palette} />
            </g>
          </>
        )}
      </svg>
      <div className="absolute bottom-2 left-3 text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6B6B6B' }}>
        {variant}
      </div>
    </div>
  );
}

function CenterSymbolMini({ symbol, palette }) {
  const primary = palette?.primary || '#B85042';
  if (symbol === 'eye')
    return (
      <>
        <ellipse rx="22" ry="13" fill="#FFFFFF" stroke="#2B2B2B" strokeWidth="1.2" />
        <circle r="8" fill={primary} />
        <circle r="3" fill="#2B2B2B" />
      </>
    );
  if (symbol === 'sun')
    return (
      <>
        <circle r="14" fill={primary} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30) * Math.PI / 180;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 18}
              y1={Math.sin(a) * 18}
              x2={Math.cos(a) * 28}
              y2={Math.sin(a) * 28}
              stroke={primary}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
      </>
    );
  if (symbol === 'moon')
    return (
      <>
        <circle r="22" fill={primary} />
        <circle cx="7" cy="-3" r="18" fill="#F5E6D3" />
      </>
    );
  if (symbol === 'flame')
    return <path d="M 0 -25 Q -13 -7 -8 11 Q 0 18 8 11 Q 13 -7 0 -25 Z" fill={primary} />;
  if (symbol === 'leaf')
    return <path d="M 0 -25 Q -18 -7 0 22 Q 18 -7 0 -25 Z" fill={primary} />;
  if (symbol === 'star')
    return (
      <polygon
        points="0,-22 6.5,-6.8 22.5,-6.8 9.4,3.2 13,19.5 0,10.7 -13,19.5 -9.4,3.2 -22.5,-6.8 -6.5,-6.8"
        fill={primary}
      />
    );
  if (symbol === 'wave')
    return (
      <path
        d="M -25 0 Q -17 -11 -8 0 T 8 0 T 25 0"
        fill="none"
        stroke={primary}
        strokeWidth="3"
        strokeLinecap="round"
      />
    );
  return null;
}
