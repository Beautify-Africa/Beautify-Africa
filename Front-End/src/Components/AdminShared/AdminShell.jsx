import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminShell({
  sectionLabel = 'Executive',
  title = 'Workspace',
  description = '',
  children,
}) {
  return (
    <div className="min-h-screen bg-[#06080C] text-zinc-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          sectionLabel={sectionLabel}
          title={title}
          description={description}
        />

        <main className="flex-1 p-6 md:p-10 max-w-[1700px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
