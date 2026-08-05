import { Container, Section } from "@ppn/ui-components";
import type { HomepageStatistic } from "@ppn/shared-types";
import { StatCounter } from "./StatCounter";

/** FR-HOME-02 — company statistics, fully CMS-driven. */
export function StatisticsSection({ statistics }: { statistics: HomepageStatistic[] }) {
  if (statistics.length === 0) return null;

  return (
    <Section className="!py-10 border-b border-neutral-200">
      <Container>
        <dl className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {statistics.map((stat) => (
            <div key={stat.id} className="text-center sm:text-left">
              <dt className="text-small text-neutral-600">{stat.label}</dt>
              <dd className="mt-1 text-h2 font-heading font-bold text-neutral-900">
                <StatCounter value={stat.value} />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
