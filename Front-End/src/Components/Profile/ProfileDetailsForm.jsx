export default function ProfileDetailsForm({
  name,
  email,
  password,
  isUpdating,
  updateMessage,
  updateError,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <section className="rounded-sm border border-stone-200 bg-white p-8 shadow-sm">
      <div>
        <h2 className="mb-8 font-serif text-3xl">Personal Details</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {updateMessage && (
            <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {updateMessage}
            </div>
          )}
          {updateError && (
            <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {updateError}
            </div>
          )}

          <div>
            <label
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500"
              htmlFor="name"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full border-b border-stone-300 bg-transparent px-0 py-3 text-sm transition-colors focus:border-stone-900 focus:outline-none focus:ring-0"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500"
              htmlFor="email"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full border-b border-stone-300 bg-transparent px-0 py-3 text-sm transition-colors focus:border-stone-900 focus:outline-none focus:ring-0"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </div>

          <div className="pt-4">
            <label
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700"
              htmlFor="password"
            >
              Change Password (Optional)
            </label>
            <input
              id="password"
              type="password"
              placeholder="Leave blank to keep current password"
              className="w-full border-b border-stone-300 bg-transparent px-0 py-3 text-sm transition-colors placeholder:text-stone-300 focus:border-stone-900 focus:outline-none focus:ring-0"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="mt-8 w-full bg-stone-900 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.25em] text-white transition-all hover:bg-amber-900 disabled:opacity-50"
          >
            {isUpdating ? 'Saving Changes...' : 'Update Details'}
          </button>
        </form>
      </div>
    </section>
  );
}
