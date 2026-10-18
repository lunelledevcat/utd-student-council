import { FlipCard } from "@/components/ui/FlipCard";
import { Reveal } from "@/components/ui/Reveal";
import { ImagePlaceholder, ZoneTitle } from "@/components/ui/bits";

// Public data only: name + role + grade. No phone / email / student ID.
type M = { id: string; name: string; role: string; dept: string; grade: string };

/** Reference layout: one zone title per department, then a 2/3/4-column grid of 3:4 photo cards. */
export function TeamGrid({ members }: { members: M[] }) {
  const depts = Array.from(new Set(members.map((m) => m.dept)));

  return (
    <div className="space-y-8 md:space-y-12">
      {depts.map((dept) => (
        <section key={dept} aria-label={`ฝ่าย${dept}`}>
          <div className="mb-4 md:mb-6"><ZoneTitle>ฝ่าย{dept}</ZoneTitle></div>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {members.filter((m) => m.dept === dept).map((m, i) => (
              <Reveal as="li" key={m.id} index={i % 4}>
                <FlipCard
                  label={`${m.name} ${m.role}`}
                  className="aspect-[3/4.3]"
                  front={
                    <div className="flex h-full flex-col gap-2 text-center">
                      <ImagePlaceholder label="[รูปสมาชิก]" className="flex-1 rounded-md" />
                      <p className="font-display text-base font-semibold leading-tight">{m.name}</p>
                      <p className="text-sm text-muted">{m.role}</p>
                    </div>
                  }
                  back={
                    <div className="flex h-full flex-col justify-center gap-2 text-center">
                      <p className="font-display text-lg font-semibold">{m.name}</p>
                      <p>{m.role}</p>
                      <p className="text-sm text-gold">ฝ่าย{m.dept}</p>
                      <p className="text-sm">ชั้น {m.grade}</p>
                    </div>
                  }
                />
              </Reveal>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
