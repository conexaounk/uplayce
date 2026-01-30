import { Music, Users, Download, Disc } from "lucide-react";

const stats = [
  { icon: Users, value: "500+", label: "DJs Ativos" },
  { icon: Music, value: "12K+", label: "Tracks" },
  { icon: Download, value: "50K+", label: "Downloads" },
  { icon: Disc, value: "2K+", label: "Packs" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-neon" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse-neon" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6 animate-fade-in">
            <Disc className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-sm text-primary">Marketplace exclusivo para DJs</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Descubra{" "}
            <span className="neon-text">packs exclusivos</span>
            <br />
            dos melhores DJs
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Acesse coleções curadas de tracks profissionais. 
            Downloads instantâneos em alta qualidade.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="glass-card rounded-xl p-4 md:p-6 hover-glow group"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <stat.icon className="w-6 h-6 text-primary mb-2 mx-auto group-hover:text-secondary transition-colors" />
                <div className="text-2xl md:text-3xl font-bold neon-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
