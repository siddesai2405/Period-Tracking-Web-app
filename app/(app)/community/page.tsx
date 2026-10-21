"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/topbar";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type Comment = {
  id: string;
  name: string;
  body: string;
  time: string;
};

type Post = {
  id: string;
  name: string;
  avatar: string;
  time: string;
  title: string;
  body: string;
  tags: string[];
  likes: number;
  comments: Comment[];
};

const starterPosts: Post[] = [
  {
    id: "cramps-help",
    name: "Sara M.",
    avatar: "S",
    time: "2h ago",
    title: "Tips that actually helped my cramps",
    body: "Heat pad, 15 minutes of yin yoga, and magnesium-rich snacks helped more than I expected. What works for you?",
    tags: ["cramps", "self-care"],
    likes: 42,
    comments: [
      { id: "c1", name: "Mira", body: "Warm ginger tea helps me on day one.", time: "1h ago" },
      { id: "c2", name: "Anonymous", body: "The yin yoga tip is so real. Child's pose saves me.", time: "38m ago" },
    ],
  },
  {
    id: "late-stress",
    name: "Anonymous",
    avatar: "A",
    time: "5h ago",
    title: "Late by 9 days - should I worry?",
    body: "Stress has been high and my sleep is all over the place. Has anyone had a delayed cycle from stress?",
    tags: ["late", "stress"],
    likes: 18,
    comments: [
      { id: "c3", name: "Nisha", body: "Stress delayed mine by almost two weeks once. Tracking helped me see the pattern.", time: "4h ago" },
      { id: "c4", name: "Lotus note", body: "If pregnancy is possible or symptoms feel unusual, a test or doctor check-in can give clarity.", time: "3h ago" },
    ],
  },
  {
    id: "seed-cycling",
    name: "Riya K.",
    avatar: "R",
    time: "1d ago",
    title: "Started seed cycling - month 1 update",
    body: "Pumpkin and flax in follicular phase, sunflower and sesame in luteal. Mood feels more even so far.",
    tags: ["nutrition", "hormones"],
    likes: 91,
    comments: [
      { id: "c5", name: "Leah", body: "I add ground flax to oats. It is the easiest way for me to stay consistent.", time: "18h ago" },
      { id: "c6", name: "Anonymous", body: "Would love a week two update if you keep going.", time: "12h ago" },
    ],
  },
];

const doctors = [
  { name: "Dr. Priya Sharma", spec: "Gynaecologist", exp: "12 yrs", rating: 4.9, fee: "INR 600", query: "priya-sharma" },
  { name: "Dr. Aisha Khan", spec: "Reproductive Health", exp: "9 yrs", rating: 4.8, fee: "INR 750", query: "aisha-khan" },
  { name: "Dr. Maya Iyer", spec: "Endocrinology - PCOS", exp: "15 yrs", rating: 4.95, fee: "INR 900", query: "maya-iyer" },
];

const COMMUNITY_POSTS_KEY = "bloom-community-posts";
const COMMUNITY_LIKES_KEY = "bloom-community-likes";

const cleanTags = (value: string) => {
  const tags = value
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
    .filter(Boolean)
    .slice(0, 4);

  return tags.length ? Array.from(new Set(tags)) : ["support"];
};

const isComment = (value: unknown): value is Comment => {
  const comment = value as Partial<Comment>;
  return (
    typeof comment?.id === "string" &&
    typeof comment.name === "string" &&
    typeof comment.body === "string" &&
    typeof comment.time === "string"
  );
};

const isPost = (value: unknown): value is Post => {
  const post = value as Partial<Post>;
  return (
    typeof post?.id === "string" &&
    typeof post.name === "string" &&
    typeof post.avatar === "string" &&
    typeof post.time === "string" &&
    typeof post.title === "string" &&
    typeof post.body === "string" &&
    Array.isArray(post.tags) &&
    post.tags.every((tag) => typeof tag === "string") &&
    typeof post.likes === "number" &&
    Array.isArray(post.comments) &&
    post.comments.every(isComment)
  );
};

export default function CommunityPage() {
  const push = useToast((state) => state.push);
  const composerRef = useRef<HTMLDivElement>(null);
  const topicsRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<Post[]>(starterPosts);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [activeTopic, setActiveTopic] = useState("all");
  const [showComposer, setShowComposer] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [hasLoadedCommunity, setHasLoadedCommunity] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    body: "",
    tags: "",
    anonymous: true,
  });

  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem(COMMUNITY_POSTS_KEY);
      const savedLikes = localStorage.getItem(COMMUNITY_LIKES_KEY);

      if (savedPosts) {
        const parsedPosts = JSON.parse(savedPosts);
        if (Array.isArray(parsedPosts) && parsedPosts.every(isPost)) {
          setPosts(parsedPosts);
        }
      }

      if (savedLikes) {
        const parsedLikes = JSON.parse(savedLikes) as Record<string, unknown>;
        const likes = Object.fromEntries(
          Object.entries(parsedLikes).filter(([, value]) => typeof value === "boolean"),
        ) as Record<string, boolean>;
        setLikedPosts(likes);
      }
    } catch {
      localStorage.removeItem(COMMUNITY_POSTS_KEY);
      localStorage.removeItem(COMMUNITY_LIKES_KEY);
    } finally {
      setHasLoadedCommunity(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCommunity) return;
    localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(posts));
  }, [hasLoadedCommunity, posts]);

  useEffect(() => {
    if (!hasLoadedCommunity) return;
    localStorage.setItem(COMMUNITY_LIKES_KEY, JSON.stringify(likedPosts));
  }, [hasLoadedCommunity, likedPosts]);

  const topics = useMemo(() => {
    const tags = posts.flatMap((post) => post.tags);
    return ["all", ...Array.from(new Set(tags))];
  }, [posts]);

  const visiblePosts = useMemo(
    () => (activeTopic === "all" ? posts : posts.filter((post) => post.tags.includes(activeTopic))),
    [activeTopic, posts],
  );

  const openComposer = () => {
    setShowComposer(true);
    requestAnimationFrame(() => composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const browseTopics = () => {
    topicsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleLike = (postId: string) => {
    setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const submitPost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = draft.title.trim();
    const body = draft.body.trim();

    if (!title || !body) {
      push({
        title: "Add a little more",
        description: "A title and message are needed before sharing.",
        tone: "info",
      });
      return;
    }

    const name = draft.anonymous ? "Anonymous" : "You";
    const newPost: Post = {
      id: `post-${Date.now()}`,
      name,
      avatar: draft.anonymous ? "A" : "Y",
      time: "Just now",
      title,
      body,
      tags: cleanTags(draft.tags),
      likes: 0,
      comments: [],
    };

    setPosts((current) => [newPost, ...current]);
    setDraft({ title: "", body: "", tags: "", anonymous: true });
    setShowComposer(false);
    setActiveTopic("all");
    push({
      title: "Post shared",
      description: "Your community post is now at the top of the feed.",
      tone: "success",
    });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const submitComment = (postId: string) => {
    const body = commentDrafts[postId]?.trim();
    if (!body) return;

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                { id: `comment-${Date.now()}`, name: "You", body, time: "Just now" },
              ],
            }
          : post,
      ),
    );
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  return (
    <div>
      <Topbar title="Community" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]"
      >
        <main className="space-y-5">
          <section className="section-panel overflow-hidden p-0">
            <div className="hero-clean-surface relative overflow-hidden p-5 sm:p-7">
              <div className="hero-clean-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" />
              <div className="relative">
                <Badge tone="rose">
                  <Users size={13} />
                  Safe circle
                </Badge>
                <h1 className="mt-3 font-display text-3xl font-semibold tracking-normal text-[rgb(var(--fg))] sm:text-5xl">
                  Ask, share, and feel less alone.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
                  A moderated wellness space for period questions, cycle stories, doctor guidance, and supportive conversations.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button type="button" onClick={openComposer}>
                    <MessageCircle size={16} />
                    New post
                  </Button>
                  <Button type="button" variant="outline" onClick={browseTopics}>
                    <Sparkles size={16} />
                    Browse topics
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section ref={topicsRef} className="section-panel p-4">
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  aria-pressed={activeTopic === topic}
                  onClick={() => setActiveTopic(topic)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-xs font-bold capitalize transition",
                    activeTopic === topic
                      ? "border-transparent bg-brand-gradient text-white shadow-[0_16px_34px_-24px_var(--acc-glow)]"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] text-[rgb(var(--muted))] hover:border-[rgb(var(--acc-200))] hover:text-[rgb(var(--fg))]",
                  )}
                >
                  {topic === "all" ? "All topics" : `#${topic}`}
                </button>
              ))}
            </div>
          </section>

          <AnimatePresence initial={false}>
            {showComposer && (
              <motion.section
                ref={composerRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="section-panel p-5"
              >
                <form onSubmit={submitPost} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Start a conversation</h2>
                      <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">Share a question, win, or cycle note with the community.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowComposer(false)}
                      className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-bold text-[rgb(var(--muted))] transition hover:text-[rgb(var(--fg))]"
                    >
                      Cancel
                    </button>
                  </div>

                  <input
                    value={draft.title}
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Post title"
                    className="h-12 w-full rounded-[18px] border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--card)/0.68)] px-4 text-sm font-semibold text-[rgb(var(--fg))] outline-none transition focus:border-[rgb(var(--acc-300))] focus:ring-2 focus:ring-[rgb(var(--acc-200)/0.45)] dark:bg-white/[0.07]"
                    maxLength={90}
                  />
                  <textarea
                    value={draft.body}
                    onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                    placeholder="What's on your mind?"
                    rows={4}
                    className="w-full resize-none rounded-[18px] border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--card)/0.68)] px-4 py-3 text-sm font-semibold leading-6 text-[rgb(var(--fg))] outline-none transition focus:border-[rgb(var(--acc-300))] focus:ring-2 focus:ring-[rgb(var(--acc-200)/0.45)] dark:bg-white/[0.07]"
                    maxLength={420}
                  />
                  <input
                    value={draft.tags}
                    onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                    placeholder="Tags separated by commas, e.g. cramps, stress"
                    className="h-12 w-full rounded-[18px] border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--card)/0.68)] px-4 text-sm font-semibold text-[rgb(var(--fg))] outline-none transition focus:border-[rgb(var(--acc-300))] focus:ring-2 focus:ring-[rgb(var(--acc-200)/0.45)] dark:bg-white/[0.07]"
                    maxLength={80}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--muted))]">
                      <input
                        type="checkbox"
                        checked={draft.anonymous}
                        onChange={(event) => setDraft((current) => ({ ...current, anonymous: event.target.checked }))}
                        className="h-4 w-4 rounded border-[rgb(var(--border))] accent-[rgb(var(--acc-500))]"
                      />
                      Post anonymously
                    </label>
                    <Button type="submit">
                      <Send size={16} />
                      Share post
                    </Button>
                  </div>
                </form>
              </motion.section>
            )}
          </AnimatePresence>

          {visiblePosts.length === 0 ? (
            <section className="section-panel p-8 text-center">
              <p className="font-display text-xl font-semibold text-[rgb(var(--fg))]">No posts in this topic yet</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">Start one and it will appear here.</p>
              <Button type="button" onClick={openComposer} className="mt-5">
                <MessageCircle size={16} />
                New post
              </Button>
            </section>
          ) : null}

          {visiblePosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="section-panel p-5 transition hover:-translate-y-0.5 hover:shadow-[0_24px_62px_-44px_rgba(89,52,84,0.55)]"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient font-display text-lg font-bold text-white shadow-[0_18px_42px_-28px_var(--acc-glow)]">
                  {post.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[rgb(var(--muted))]">
                    <span className="text-[rgb(var(--fg))]">{post.name}</span>
                    <span>-</span>
                    <span>{post.time}</span>
                  </div>
                  <h2 className="mt-1 font-display text-xl font-semibold text-[rgb(var(--fg))]">{post.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{post.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} tone="lavender">#{tag}</Badge>
                    ))}
                  </div>
                  <div className="mt-5 flex gap-4 text-sm font-semibold text-[rgb(var(--muted))]">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className="inline-flex items-center gap-1.5 transition hover:text-[rgb(var(--acc-600))]"
                    >
                      <Heart size={15} className={likedPosts[post.id] ? "fill-current text-rose-500" : ""} />
                      {post.likes + (likedPosts[post.id] ? 1 : 0)}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleComments(post.id)}
                      aria-expanded={!!expandedComments[post.id]}
                      className="inline-flex items-center gap-1.5 transition hover:text-[rgb(var(--acc-600))]"
                    >
                      <MessageCircle size={15} />
                      {post.comments.length}
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {expandedComments[post.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-5 overflow-hidden"
                      >
                        <div className="space-y-3 border-t border-[rgb(var(--border)/0.72)] pt-4">
                          {post.comments.length ? (
                            post.comments.map((comment) => (
                              <div key={comment.id} className="rounded-[18px] bg-[rgb(var(--surface)/0.56)] p-3 dark:bg-white/[0.05]">
                                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[rgb(var(--muted))]">
                                  <span className="text-[rgb(var(--fg))]">{comment.name}</span>
                                  <span>-</span>
                                  <span>{comment.time}</span>
                                </div>
                                <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{comment.body}</p>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-[18px] bg-[rgb(var(--surface)/0.56)] p-3 text-sm text-[rgb(var(--muted))] dark:bg-white/[0.05]">
                              Be the first to reply.
                            </p>
                          )}

                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              submitComment(post.id);
                            }}
                            className="flex flex-col gap-2 sm:flex-row"
                          >
                            <input
                              value={commentDrafts[post.id] ?? ""}
                              onChange={(event) =>
                                setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                              }
                              placeholder="Write a supportive reply"
                              className="h-11 min-w-0 flex-1 rounded-[16px] border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--card)/0.68)] px-4 text-sm font-semibold text-[rgb(var(--fg))] outline-none transition focus:border-[rgb(var(--acc-300))] focus:ring-2 focus:ring-[rgb(var(--acc-200)/0.45)] dark:bg-white/[0.07]"
                              maxLength={180}
                            />
                            <Button type="submit" variant="soft" className="sm:w-auto">
                              <Send size={15} />
                              Reply
                            </Button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.article>
          ))}
        </main>

        <aside className="space-y-5 xl:sticky xl:top-[104px] xl:self-start">
          <section className="section-panel p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                <Stethoscope size={19} />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Talk to a doctor</h2>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">Verified specialists for reproductive health questions.</p>
              </div>
            </div>
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div key={doctor.name} className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-semibold text-[rgb(var(--fg))]">{doctor.name}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{doctor.spec} - {doctor.exp}</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-200">
                        <Star size={13} className="fill-current" />
                        {doctor.rating}
                      </p>
                    </div>
                    <span className="rounded-full bg-[rgb(var(--acc-50))] px-3 py-1 text-xs font-bold text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                      {doctor.fee}
                    </span>
                  </div>
                  <Link
                    href={`/doctor?doctor=${doctor.query}`}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[18px] bg-brand-gradient px-3.5 text-[13px] font-extrabold text-white shadow-[0_18px_42px_-28px_var(--acc-glow)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--acc-300))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]"
                  >
                    <Video size={14} />
                    Book consult
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="section-panel p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-[rgb(var(--fg))]">Safe space promise</h2>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  Posts are moderated, anonymous sharing is supported, and health advice is clearly separated from medical diagnosis.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </motion.div>
    </div>
  );
}
