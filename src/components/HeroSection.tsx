export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ paddingTop: "80px", display: "flex", flexDirection: "column" }}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold" style={{ margin: "79px 0 24px" }}>
            <div style={{ marginLeft: "1px" }}>Descubra</div>
            <span className="neon-text">packs exclusivos</span>
            <br />
            <p style={{ fontWeight: "700", marginTop: "16px" }}>dos DJs</p>
          </h1>
          <img
            loading="lazy"
            srcSet="https://cdn.builder.io/api/v1/image/assets%2F526c72c739f249c19399682ede8902d8%2F085b87a4189a48d7a05a35558389ce8a?width=100 100w, https://cdn.builder.io/api/v1/image/assets%2F526c72c739f249c19399682ede8902d8%2F085b87a4189a48d7a05a35558389ce8a?width=200 200w, https://cdn.builder.io/api/v1/image/assets%2F526c72c739f249c19399682ede8902d8%2F085b87a4189a48d7a05a35558389ce8a?width=400 400w, https://cdn.builder.io/api/v1/image/assets%2F526c72c739f249c19399682ede8902d8%2F085b87a4189a48d7a05a35558389ce8a?width=800 800w, https://cdn.builder.io/api/v1/image/assets%2F526c72c739f249c19399682ede8902d8%2F085b87a4189a48d7a05a35558389ce8a?width=1200 1200w, https://cdn.builder.io/api/v1/image/assets%2F526c72c739f249c19399682ede8902d8%2F085b87a4189a48d7a05a35558389ce8a?width=1600 1600w, https://cdn.builder.io/api/v1/image/assets%2F526c72c739f249c19399682ede8902d8%2F085b87a4189a48d7a05a35558389ce8a?width=2000 2000w"
            style={{
              aspectRatio: "3.27",
              objectFit: "contain",
              objectPosition: "center",
              width: "auto",
              height: "auto",
              minHeight: "60px",
              paddingBottom: "39px",
              margin: "-5px auto 0",
            }}
          />
        </div>
      </div>
    </section>
  );
}
