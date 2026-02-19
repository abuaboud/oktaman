"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { ChevronRight, ArrowRight, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptItem {
  label: string;
  prompt: string;
  verified?: boolean;
}

interface Category {
  id: string;
  label: string;
  description: string;
  iconPath: string;
  items: PromptItem[];
}

// Modern category styling - clean with accent colors
const CATEGORY_STYLES: Record<string, {
  border: string;
  iconBg: string;
}> = {
  adulting: {
    border: "border-border/30 hover:border-violet-500/40",
    iconBg: "bg-violet-500/10",
  },
  travel: {
    border: "border-border/30 hover:border-orange-500/40",
    iconBg: "bg-orange-500/10",
  },
  entertainment: {
    border: "border-border/30 hover:border-fuchsia-500/40",
    iconBg: "bg-fuchsia-500/10",
  },
  wellness: {
    border: "border-border/30 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
  },
  creative: {
    border: "border-border/30 hover:border-amber-500/40",
    iconBg: "bg-amber-500/10",
  },
  teamVibes: {
    border: "border-border/30 hover:border-rose-500/40",
    iconBg: "bg-rose-500/10",
  },
};

const CATEGORIES: Category[] = [
  {
    id: "adulting",
    label: "Adulting Helper",
    description: "The boring stuff, made less boring",
    iconPath: "/icons/adulting.svg",
    items: [
      { label: "Renew car registration", prompt: "Remind me to renew my car registration next month with all the documents I'll need and where to go." },
      { label: "Compare internet providers", prompt: "Help me compare internet providers in my area - pricing, speeds, customer reviews, and any promotions." },
      { label: "Moving checklist", prompt: "Create a comprehensive moving apartment checklist with tasks, timeline, and things I shouldn't forget." },
      { label: "Book dentist appointment", prompt: "Find the best time to book a dentist appointment based on my calendar and suggest highly-rated dentists nearby." },
      { label: "Water plant reminders", prompt: "Set up weekly reminders to water my plants on Tuesdays and Fridays with care tips for each type." },
    ],
  },
  {
    id: "travel",
    label: "Travel & Adventure",
    description: "Plan your next escape",
    iconPath: "/icons/travel.svg",
    items: [
      { label: "Cheap flights to Japan", prompt: "Find cheap flights to Japan in spring, track price changes, and alert me when there's a good deal." },
      { label: "Rome itinerary", prompt: "Create a 3-day itinerary for Rome with must-see attractions, local restaurants, and the best routes between them." },
      { label: "Barcelona hidden gems", prompt: "What are hidden gems to visit in Barcelona? Find local favorites, secret spots, and places tourists don't usually go." },
      { label: "Track hotel prices", prompt: "Track price drops for hotels in Bali and notify me when prices fall below my budget or when there's a special deal." },
      { label: "Iceland packing list", prompt: "Build a packing list for hiking in Iceland based on the season, weather forecast, and the trails I'm planning." },
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment Finder",
    description: "What to watch, play, and enjoy",
    iconPath: "/icons/entertainment.svg",
    items: [
      { label: "Cozy movie tonight", prompt: "Recommend a cozy movie for tonight based on my mood, what I've watched recently, and highly-rated options." },
      { label: "Weekend events", prompt: "Find concerts and events near me this weekend - music, comedy, art shows, or anything fun happening." },
      { label: "4-player board games", prompt: "What board games are perfect for 4 players? Suggest fun options based on difficulty, playtime, and game style." },
      { label: "New indie games", prompt: "Show me new indie games on Steam that match my interests, are highly rated, and recently released." },
      { label: "Books like Harry Potter", prompt: "Find book recommendations similar to Harry Potter - fantasy adventures with great world-building and memorable characters." },
    ],
  },
  {
    id: "wellness",
    label: "Wellness Coach",
    description: "Small steps to feel better every day",
    iconPath: "/icons/wellness.svg",
    items: [
      { label: "Morning routine", prompt: "Create a simple 10-minute morning routine for me that includes stretching, mindfulness, and energizing habits." },
      { label: "Meal prep ideas", prompt: "Suggest healthy meal prep ideas for the week that are easy to make, nutritious, and taste great reheated." },
      { label: "Stretch break reminders", prompt: "Remind me to take stretch breaks every hour with quick exercises I can do at my desk." },
      { label: "Beginner yoga videos", prompt: "Find beginner-friendly yoga videos on YouTube - short sessions, clear instructions, and highly rated instructors." },
      { label: "Track water intake", prompt: "Track my daily water intake, remind me to drink throughout the day, and show my progress toward 8 glasses." },
    ],
  },
  {
    id: "creative",
    label: "Creative Sidekick",
    description: "Bring your passion projects to life",
    iconPath: "/icons/creative.svg",
    items: [
      { label: "Blog post ideas", prompt: "Help me brainstorm blog post ideas about travel - unique angles, trending topics, and stories that would resonate." },
      { label: "Royalty-free music", prompt: "Find royalty-free music for my YouTube video that matches the mood, genre, and vibe I'm going for." },
      { label: "Color palettes", prompt: "Generate color palettes inspired by sunsets - warm, vibrant combinations perfect for design projects." },
      { label: "Track writing progress", prompt: "Track my writing progress this month - word count, daily goals, and streak tracking to keep me motivated." },
      { label: "Start a podcast", prompt: "Research how to start a podcast from scratch - equipment, hosting platforms, editing tools, and tips for beginners." },
    ],
  },
  {
    id: "teamVibes",
    label: "Team Vibes",
    description: "Make work feel less like work",
    iconPath: "/icons/team-vibes.svg",
    items: [
      { label: "Kudos for teammate", prompt: "Create a kudos message for my amazing teammate that recognizes their hard work and impact on the team." },
      { label: "Virtual happy hour", prompt: "Plan a virtual team happy hour with fun activities, games, and conversation starters everyone will enjoy." },
      { label: "Icebreaker questions", prompt: "Suggest creative icebreaker questions for our meeting that are fun, engaging, and help the team connect." },
      { label: "Team building games", prompt: "Find team building games for remote teams that are easy to set up, interactive, and bring people together." },
      { label: "Celebration message", prompt: "Draft a celebration message for hitting our milestone that captures the team's effort and excitement." },
    ],
  },
];

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  onHoverPrompt?: (prompt: string | null) => void;
}

export const PromptSuggestions = memo(function PromptSuggestions({
  onSelectPrompt,
  onHoverPrompt,
}: PromptSuggestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Handle mouse wheel scrolling for horizontal scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // If scrolling horizontally already or no vertical scroll, skip
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Convert vertical scroll to horizontal scroll
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [selectedCategory]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollState();
    container.addEventListener("scroll", updateScrollState);

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, selectedCategory]);

  // Group categories into pairs for 2-row layout
  const categoryPairs: Category[][] = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    categoryPairs.push(CATEGORIES.slice(i, i + 2));
  }

  return (
    <div className="px-4 pb-4">
      <div className="mx-auto max-w-3xl">
        {selectedCategory ? (
          // Expanded category view with actions
          <div className="animate-in fade-in duration-150">
            {/* Back button and category info */}
            <div className="mb-3 flex items-center gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
                <span>Back</span>
              </button>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <img src={selectedCategory.iconPath} alt="" className="h-4 w-4" />
                <span className="text-sm font-medium text-foreground">{selectedCategory.label}</span>
              </div>
            </div>

            {/* Action buttons in a flowing layout */}
            <div
              className="flex flex-wrap gap-2"
              onMouseLeave={() => onHoverPrompt?.(null)}
            >
              {selectedCategory.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onSelectPrompt(item.prompt)}
                  onMouseEnter={() => onHoverPrompt?.(item.prompt)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3.5 py-2.5 text-sm",
                    "hover:border-foreground/20 hover:bg-foreground/[0.03] transition-all",
                    "text-foreground/80 hover:text-foreground group"
                  )}
                >
                  <span>{item.label}</span>
                  {item.verified && (
                    <span className="relative flex items-center group/verified">
                      <BadgeCheck className="h-4 w-4 text-blue-500" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded-md whitespace-nowrap opacity-0 group-hover/verified:opacity-100 transition-opacity pointer-events-none z-50">
                        Verified — Tested and works as expected
                      </span>
                    </span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground/50 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Horizontally scrollable categories with 2 rows per column
          <div className="relative animate-in fade-in duration-150">
            {/* Left gradient */}
            <div
              className={cn(
                "pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10",
                "bg-gradient-to-r from-background to-transparent",
                "transition-opacity duration-200",
                canScrollLeft ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Right gradient */}
            <div
              className={cn(
                "pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10",
                "bg-gradient-to-l from-background to-transparent",
                "transition-opacity duration-200",
                canScrollRight ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Scrollable container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-0.5"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categoryPairs.map((pair, pairIndex) => (
                <div key={pairIndex} className="flex flex-col gap-2 flex-shrink-0">
                  {pair.map((category) => {
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-left w-[220px]",
                          "bg-card/20 backdrop-blur-sm",
                          "hover:shadow-md hover:shadow-black/[0.03]",
                          "transition-all duration-150 ease-out group",
                          CATEGORY_STYLES[category.id]?.border || "border-border/30"
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          "transition-all duration-300",
                          CATEGORY_STYLES[category.id]?.iconBg || "bg-foreground/[0.06]"
                        )}>
                          <img src={category.iconPath} alt="" className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm text-foreground/90 group-hover:text-foreground transition-colors">{category.label}</h3>
                          <p className="text-xs text-muted-foreground/70 group-hover:text-muted-foreground transition-colors truncate">{category.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
