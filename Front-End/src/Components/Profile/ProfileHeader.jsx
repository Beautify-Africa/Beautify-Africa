import { getInitials } from '../../utils/userDisplay';

export default function ProfileHeader({ user, memberSince }) {
  return (
    <header className="mb-12 flex flex-col justify-between gap-6 border-b border-stone-200 pb-10 md:flex-row md:items-end">
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-700">Client Dashboard</p>
        <h1 className="font-serif text-5xl text-stone-900 md:text-6xl">My Account</h1>
      </div>

      <div className="flex items-center gap-4 rounded-sm border border-stone-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-sm font-bold uppercase tracking-widest text-amber-800">
          {getInitials(user.name)}
        </div>
        <div>
          <p className="font-serif text-lg leading-tight">{user.name}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-stone-400">
            Member since {memberSince}
          </p>
        </div>
      </div>
    </header>
  );
}
