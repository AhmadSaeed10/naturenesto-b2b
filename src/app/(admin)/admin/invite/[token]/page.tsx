import { Suspense } from "react";
import { InviteAcceptForm } from "@/components/admin/InviteAcceptForm";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Logo } from "@/components/ui/Logo";
import { admin } from "@/content/admin";
import { findLiveInvite } from "@/lib/auth/invites";

const copy = admin.invite;

async function InvitePanel({ params }: PageProps<"/admin/invite/[token]">) {
  const { token } = await params;
  const invite = await findLiveInvite(token);
  if (!invite) return <p className="text-ink">{copy.expired}</p>;
  return <InviteAcceptForm token={token} email={invite.email} />;
}

export default function InvitePage(props: PageProps<"/admin/invite/[token]">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-card border border-line bg-background p-6 sm:p-8">
        <Logo />
        <div className="flex flex-col gap-3">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="text-h3">{copy.title}</h1>
          <p className="text-ink-muted">{copy.intro}</p>
        </div>
        <Suspense>
          <InvitePanel {...props} />
        </Suspense>
      </div>
    </main>
  );
}
