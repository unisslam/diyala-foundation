import React, { useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Star, Quote } from "lucide-react";
import { useTestimonials } from "@/hooks/useTestimonials";
import type { Testimonial } from "@/types/testimonial.types";

/* ──────────────────────────────────────────────────────────────────
   STATIC SEED DATA — shown while Supabase data loads / as fallback
   Drawn from real Facebook activity of affiliated teams.
   ────────────────────────────────────────────────────────────────── */
const SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: "seed-1",
    created_at: "2024-11-13T00:00:00.000Z",
    updated_at: "2024-11-13T00:00:00.000Z",
    author_name_ar: "فريق نساء وشباب ديالى للسلام",
    author_name_en: "Diyala Women & Youth for Peace",
    role_ar: "شريك تنفيذي",
    role_en: "Implementation Partner",
    body_ar:
      "من خلال مبادرة 'قاعات السلام' أعدنا تأهيل ثلاث قاعات رياضية، إحداها مخصصة لتدريبات أبطالنا من ذوي الهمم. هذا هو التغيير الحقيقي.",
    body_en:
      "Through the 'Peace Halls' initiative, we rehabilitated three sports halls — one dedicated to champions with disabilities. This is real change.",
    rating: 5,
    status: "approved",
    source: "Facebook",
    avatar_path: null,
  },
  {
    id: "seed-2",
    created_at: "2024-11-06T00:00:00.000Z",
    updated_at: "2024-11-06T00:00:00.000Z",
    author_name_ar: "إحدى المتدربات — مشغل السلام",
    author_name_en: "Trainee — Peace Workshop",
    role_ar: "مستفيدة من برنامج التمكين",
    role_en: "Empowerment Programme Beneficiary",
    body_ar:
      "تدربنا لمدة 6 أيام على فن الباترون والتصميم، وكانت الورشة تبدأ دائماً بمحاضرة عن بناء السلام. خرجنا بمهارة وبأمل جديد.",
    body_en:
      "We trained for 6 days in pattern-making and design. Every session started with a peacebuilding lecture. We left with skills and renewed hope.",
    rating: 5,
    status: "approved",
    source: "Testimonial Form",
    avatar_path: null,
  },
  {
    id: "seed-3",
    created_at: "2024-11-09T00:00:00.000Z",
    updated_at: "2024-11-09T00:00:00.000Z",
    author_name_ar: "عضو من فريق شباب الأنبار للسلام",
    author_name_en: "Member — Anbar Youth for Peace Team",
    role_ar: "شريك من محافظة الأنبار",
    role_en: "Partner from Anbar Governorate",
    body_ar:
      "اتعنا من الأنبار لديالى لنقول إن العراق واحد. مبادرة 'شوارع السلام' كانت رسالة حقيقية للوحدة الوطنية.",
    body_en:
      "We came from Anbar to Diyala to say Iraq is one. The 'Peace Streets' initiative was a genuine message of national unity.",
    rating: 5,
    status: "approved",
    source: "Facebook",
    avatar_path: null,
  },
  {
    id: "seed-4",
    created_at: "2024-11-12T00:00:00.000Z",
    updated_at: "2024-11-12T00:00:00.000Z",
    author_name_ar: "مستمعة في بودكاست السلام",
    author_name_en: "Peace Podcast Listener",
    role_ar: "من المجتمع المحلي",
    role_en: "Community Member",
    body_ar:
      "حلقات بودكاست السلام فتحت عقلي على أفكار جديدة لبناء مجتمع متماسك. شكراً لفريق نساء ديالى على هذا الجهد.",
    body_en:
      "The Peace Podcast opened my mind to new ideas for building a cohesive community. Thank you to the Diyala Women's team for this effort.",
    rating: 4,
    status: "approved",
    source: "Social Media",
    avatar_path: null,
  },
  {
    id: "seed-5",
    created_at: "2024-11-05T00:00:00.000Z",
    updated_at: "2024-11-05T00:00:00.000Z",
    author_name_ar: "ممثل عن منظمة حواء للإغاثة والتنمية",
    author_name_en: "Hawa' Organization Representative",
    role_ar: "شريك تنفيذي",
    role_en: "Implementing Partner",
    body_ar:
      "الشراكة مع مؤسسة نهر ديالى وفرقها المتعددة تُثبت أن 'اليد الواحدة لا تصفق'. نفخر بهذا التعاون المثمر.",
    body_en:
      "Partnership with Diyala River Foundation and its teams proves that 'one hand cannot clap alone'. We are proud of this fruitful cooperation.",
    rating: 5,
    status: "approved",
    source: "Partnership Report",
    avatar_path: null,
  },
];

/* ──────────────────────────────────────────────────────────────────
   TESTIMONIAL CARD
   ────────────────────────────────────────────────────────────────── */
interface CardProps {
  item: Testimonial;
  isRtl: boolean;
}

const TestimonialCard: React.FC<CardProps> = ({ item, isRtl }) => {
  const name = isRtl ? item.author_name_ar : item.author_name_en;
  const role = isRtl ? item.role_ar        : item.role_en;
  const body = isRtl ? item.body_ar        : item.body_en;

  return (
    <div
      className="flex-shrink-0 w-80 md:w-96 mx-3 p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-card hover:shadow-card-hover transition-shadow duration-300 flex flex-col gap-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < item.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}
          />
        ))}
      </div>

      {/* Quote icon */}
      <Quote
        size={22}
        className="text-primary/30"
        style={{ transform: isRtl ? "scaleX(-1)" : "none" }}
      />

      {/* Body */}
      <p className="text-sm text-foreground/80 leading-relaxed flex-1">{body}</p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/40">
        {item.avatar_path ? (
          <img
            src={item.avatar_path}
            alt={name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{name}</p>
          {role && <p className="text-xs text-muted-foreground truncate">{role}</p>}
          {item.source && (
            <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{item.source}</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────
   TICKER TRACK — infinite horizontal scroll, pauses on hover
   ────────────────────────────────────────────────────────────────── */
interface TrackProps {
  items: Testimonial[];
  isRtl: boolean;
  reverse?: boolean;
}

const TickerTrack: React.FC<TrackProps> = ({ items, isRtl, reverse = false }) => {
  const controls = useAnimationControls();
  const direction = isRtl ? (reverse ? 1 : -1) : reverse ? -1 : 1;
  const doubled = [...items, ...items];

  const startAnimation = () => {
    controls.start({
      x: `${direction * -100 / 2}%`,
      transition: {
        duration: items.length * 8,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      },
    });
  };

  React.useEffect(() => {
    startAnimation();
  }, [items.length]);

  return (
    <div
      className="overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseEnter={() => controls.stop()}
      onMouseLeave={() => startAnimation()}
    >
      <motion.div
        animate={controls}
        initial={{ x: 0 }}
        className="flex w-max"
      >
        {doubled.map((item, idx) => (
          <TestimonialCard key={`${item.id}-${idx}`} item={item} isRtl={isRtl} />
        ))}
      </motion.div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────────────────────────────────── */
interface TestimonialsTrackProps {
  onSubmitClick: () => void;
}

export const TestimonialsTrack: React.FC<TestimonialsTrackProps> = ({ onSubmitClick }) => {
  const { t, i18n } = useTranslation("about");
  const isRtl = i18n.dir() === "rtl";
  const { testimonials: liveData, loading } = useTestimonials();

  // Use live DB data; fall back to seed only when DB returns nothing after load
  const items = loading ? SEED_TESTIMONIALS : (liveData.length > 0 ? liveData : SEED_TESTIMONIALS);
  const half = Math.ceil(items.length / 2);
  const row1 = items.slice(0, half);
  const row2 = items.slice(half);

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="py-24 overflow-hidden bg-muted/20"
      id="testimonials"
      aria-label="Testimonials"
    >
      <div className="container mx-auto px-4 md:px-8 mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t("testimonials.title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("testimonials.description")}
          </p>
        </motion.div>
      </div>

      {/* Row 1 */}
      <div className="mb-4">
        {row1.length > 0 && <TickerTrack items={row1} isRtl={isRtl} />}
      </div>

      {/* Row 2 (reversed direction) */}
      <div>
        {row2.length > 0 && <TickerTrack items={row2} isRtl={isRtl} reverse />}
      </div>

      {/* Submit CTA */}
      <div className="text-center mt-12">
        <motion.button
          onClick={onSubmitClick}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:shadow-primary/30 transition-all duration-300"
        >
          {t("testimonials.submitBtn")}
        </motion.button>
      </div>
    </section>
  );
};

export default TestimonialsTrack;
