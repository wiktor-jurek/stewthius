import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold font-serif mb-4 text-broth-amber">404</h1>
        <p className="text-xl text-muted-foreground mb-2">This page fell off the stove.</p>
        <p className="text-sm text-muted-foreground mb-6">Nothing simmering here — head back to the kitchen.</p>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          🍲 Back to the Pot
        </Link>
      </div>
    </div>
  );
}
