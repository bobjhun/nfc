import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Heart,
  Image,
  MessageCircle,
  Plus,
  Send,
  UsersRound,
  Eye,
} from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  { label: "Total Followers", value: "24,892", change: "12.5%", icon: UsersRound, color: "bg-blue-50 text-blue-600" },
  { label: "Total Engagement", value: "8,734", change: "18.3%", icon: Heart, color: "bg-purple-50 text-purple-600" },
  { label: "Reach", value: "142,621", change: "26.7%", icon: Eye, color: "bg-teal-50 text-teal-600" },
  { label: "Link Clicks", value: "5,298", change: "34.2%", icon: BarChart3, color: "bg-amber-50 text-amber-600" },
];

const platforms = [
  { name: "Facebook", reach: "42,531 reach", engagement: "3.8% engagement", change: "28%", initials: "f", color: "bg-[#1877f2]" },
  { name: "Instagram", reach: "38,204 reach", engagement: "5.2% engagement", change: "34%", initials: "◎", color: "bg-gradient-to-br from-amber-400 via-rose-500 to-purple-700" },
  { name: "TikTok", reach: "27,689 reach", engagement: "6.7% engagement", change: "41%", initials: "♪", color: "bg-slate-950" },
  { name: "LinkedIn", reach: "12,492 reach", engagement: "4.1% engagement", change: "19%", initials: "in", color: "bg-sky-700" },
];

const activities = [
  { title: "Your post on Instagram got 1.2K likes", time: "2 hours ago", icon: Heart, tone: "bg-pink-100 text-pink-600" },
  { title: "New comment on Facebook", time: "4 hours ago", icon: MessageCircle, tone: "bg-blue-100 text-blue-600" },
  { title: 'Ad campaign "Brand Awareness" is now live', time: "6 hours ago", icon: Send, tone: "bg-indigo-100 text-indigo-600" },
  { title: "New follower on TikTok", time: "8 hours ago", icon: UsersRound, tone: "bg-slate-100 text-slate-700" },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeading
        title="Here's what's happening with your social media."
        description="Track performance, manage your content, and keep your brand moving forward."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Social media summary">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="gap-4 py-5 shadow-sm">
              <CardContent className="flex items-start gap-3 px-5">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-[#0f1c33]">{stat.value}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-green-600">
                    <ArrowUpRight className="size-3.5" />
                    {stat.change} <span className="font-normal text-slate-400">vs. last 30 days</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.85fr)]">
        <Card className="gap-4 py-5 shadow-sm">
          <CardHeader className="flex-row items-center justify-between px-5">
            <div>
              <CardTitle className="text-base">Performance Overview</CardTitle>
              <p className="mt-1 text-xs text-slate-500">Reach, engagement, and link clicks</p>
            </div>
            <select className="h-9 rounded-lg border bg-white px-2.5 text-xs text-slate-600" aria-label="Date range">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
            </select>
          </CardHeader>
          <CardContent className="px-5">
            <div className="mb-3 flex flex-wrap justify-center gap-5 text-[11px] text-slate-600">
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-blue-600" />Reach</span>
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-purple-500" />Engagement</span>
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-green-600" />Link clicks</span>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col justify-between pb-6 text-[10px] text-slate-400">
                <span>40K</span><span>30K</span><span>20K</span><span>10K</span><span>0</span>
              </div>
              <div className="min-w-0 flex-1">
                <svg className="h-[240px] w-full" viewBox="0 0 600 240" preserveAspectRatio="none" role="img" aria-label="Example performance trend chart">
                  <defs><linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".2" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs>
                  {[0, 60, 120, 180, 240].map((y) => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#edf1f7" />)}
                  <path d="M0 165 C25 140 45 120 70 128 S110 170 135 168 S170 118 195 110 S235 138 260 142 S300 110 325 92 S365 86 385 74 S415 40 440 38 S480 70 500 72 S535 60 560 52 S590 44 600 38 L600 240 L0 240Z" fill="url(#reachFill)" />
                  <path d="M0 165 C25 140 45 120 70 128 S110 170 135 168 S170 118 195 110 S235 138 260 142 S300 110 325 92 S365 86 385 74 S415 40 440 38 S480 70 500 72 S535 60 560 52 S590 44 600 38" fill="none" stroke="#2563eb" strokeWidth="3" />
                  <path d="M0 180 C30 168 50 150 75 152 S115 176 140 172 S180 132 205 126 S245 146 270 148 S310 120 335 106 S375 102 395 92 S430 66 455 64 S495 92 515 94 S550 84 575 76 S595 70 600 66" fill="none" stroke="#a855f7" strokeWidth="2.5" />
                  <path d="M0 196 C30 190 55 180 80 182 S120 196 145 192 S185 168 210 164 S250 176 275 178 S315 160 340 148 S380 146 400 138 S435 118 460 116 S500 140 520 142 S555 132 580 124 S595 120 600 118" fill="none" stroke="#16a34a" strokeWidth="2.5" />
                </svg>
                <div className="mt-2 flex justify-between text-[9px] text-slate-400">
                  <span>Sep 23</span><span>Sep 27</span><span>Oct 1</span><span>Oct 5</span><span>Oct 9</span><span>Oct 13</span><span>Oct 17</span><span>Oct 23</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-3 py-5 shadow-sm">
          <CardHeader className="px-5"><CardTitle className="text-base">Top Performing Platform</CardTitle></CardHeader>
          <CardContent className="px-5">
            <ul className="divide-y">
              {platforms.map((platform) => (
                <li key={platform.name} className="flex items-center gap-3 py-3.5 first:pt-1">
                  <span className={`flex size-10 items-center justify-center rounded-xl text-lg font-bold text-white ${platform.color}`}>{platform.initials}</span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-xs font-semibold text-[#0f1c33]">{platform.name}</strong>
                    <span className="mt-1 block text-[10px] text-slate-500">{platform.reach}</span>
                    <span className="block text-[10px] text-slate-400">{platform.engagement}</span>
                  </span>
                  <span className="flex items-center text-xs font-semibold text-green-600"><ArrowUpRight className="size-3.5" />{platform.change}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <Card className="gap-4 py-5 shadow-sm">
          <CardHeader className="flex-row items-center justify-between px-5">
            <div><CardTitle className="text-base">Quick Actions</CardTitle><p className="mt-1 text-xs text-slate-500">Shortcuts to your everyday work</p></div>
            <Button nativeButton={false} render={<Link href="/qr-codes" />} size="sm"><Plus className="size-4" />Create QR Code</Button>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 px-5 sm:grid-cols-4">
            {[["Schedule Post", CalendarDays], ["Upload Media", Image], ["View Calendar", CalendarDays], ["Check Analytics", BarChart3]].map(([label, Icon]) => {
              const ActionIcon = Icon as typeof CalendarDays;
              return <button key={label as string} className="flex flex-col items-start gap-3 rounded-xl border bg-white p-4 text-left text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:shadow-sm"><span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><ActionIcon className="size-4" /></span>{label as string}</button>;
            })}
          </CardContent>
        </Card>

        <Card className="gap-4 py-5 shadow-sm">
          <CardHeader className="flex-row items-center justify-between px-5"><CardTitle className="text-base">Recent Activity</CardTitle><Button variant="link" size="sm">View All</Button></CardHeader>
          <CardContent className="px-5">
            <ul className="divide-y">
              {activities.map((activity) => {
                const Icon = activity.icon;
                return <li key={activity.title} className="flex items-center gap-3 py-3 first:pt-0"><span className={`flex size-9 items-center justify-center rounded-full ${activity.tone}`}><Icon className="size-4" /></span><span className="min-w-0"><strong className="block text-[11px] font-semibold text-[#0f1c33]">{activity.title}</strong><span className="mt-1 block text-[10px] text-slate-400">{activity.time}</span></span></li>;
              })}
            </ul>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
