import { useMemo, useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

function SidebarFilterItem({ item, selectedFilters, onToggle }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/10 bg-zinc-900/70 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md sm:rounded-[24px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group flex w-full items-center gap-3 px-3 py-3 text-left transition duration-300 hover:bg-white/[0.04] sm:px-4 sm:py-4"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-inner">
          <div className="h-2.5 w-2.5 rounded-full bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-[0.01em] text-white/90">
            {item.title}
          </div>
          <div className="mt-0.5 truncate text-xs text-white/45">
            {item.filters.length} opções
          </div>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition duration-300 group-hover:bg-white/[0.06] group-hover:text-white">
          <span
            className={`select-none text-sm leading-none transition-transform duration-300 ease-out ${
              open ? "-rotate-90" : "rotate-0"
            }`}
            aria-hidden="true"
          >
            ◂
          </span>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/5 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
            <ul className="space-y-2">
              {item.filters.map((filter) => (
                <li key={filter.id}>
                  <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-white/70 transition duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-white/90">
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter.id)}
                      onChange={() => onToggle(item.id, filter.id)}
                      className="peer sr-only"
                    />

                    <div className="flex h-4 w-4 items-center justify-center rounded border border-white/20 bg-zinc-950 peer-checked:border-white peer-checked:bg-white">
                      <svg
                        className="h-3 w-3 opacity-0 peer-checked:opacity-100"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 10.5L8.5 14L15 7.5"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="truncate">{filter.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsSection() {
  const [sidebarItems, setSidebarItems] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  async function fetchSidebarFilters() {
    try {
      setFiltersLoading(true);

      const { data: groups, error: groupsError } = await supabase
        .from("filter_groups")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (groupsError) throw groupsError;

      const { data: options, error: optionsError } = await supabase
        .from("filter_options")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (optionsError) throw optionsError;

      const mappedSidebarItems = (groups || []).map((group) => ({
        id: group.slug,
        title: group.title,
        filters: (options || [])
          .filter((option) => option.group_id === group.id)
          .map((option) => ({
            id: option.slug,
            label: option.label,
          })),
      }));

      setSidebarItems(mappedSidebarItems);

      const initialSelectedFilters = mappedSidebarItems.reduce((acc, item) => {
        acc[item.id] = [];
        return acc;
      }, {});

      setSelectedFilters(initialSelectedFilters);
    } catch (error) {
      console.error("Erro ao buscar filtros:", error);
    } finally {
      setFiltersLoading(false);
    }
  }

  async function fetchProjects() {
    try {
      setLoading(true);

      const { data, error } = await supabase.from("projects").select(`
        *,
        project_filter_values (
          filter_option_id,
          filter_options (
            id,
            slug,
            label,
            group_id,
            filter_groups (
              id,
              slug,
              title
            )
          )
        )
      `);

      if (error) throw error;

      console.log("PROJECTS RAW:", data);

      const normalizedProjects = (data || []).map((project) => {
        const filterValues = {};

        (project.project_filter_values || []).forEach((item) => {
          const option = item.filter_options;
          const group = option?.filter_groups;

          if (!option || !group) return;

          if (!filterValues[group.slug]) {
            filterValues[group.slug] = [];
          }

          filterValues[group.slug].push(option.slug);
        });

        return {
          ...project,
          filterValues,
        };
      });

      setProjects(normalizedProjects);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
    fetchSidebarFilters();
  }, []);

  function handleToggleFilter(groupId, filterId) {
    setSelectedFilters((prev) => {
      const currentGroup = prev[groupId] || [];
      const alreadySelected = currentGroup.includes(filterId);

      return {
        ...prev,
        [groupId]: alreadySelected
          ? currentGroup.filter((id) => id !== filterId)
          : [...currentGroup, filterId],
      };
    });
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = (project.title || "")
        .toLowerCase()
        .includes(search.toLowerCase());

      const activeGroups = Object.entries(selectedFilters).filter(
        ([, values]) => values.length > 0,
      );

      const matchesDynamicFilters = activeGroups.every(([groupId, values]) => {
        const projectValues = project.filterValues?.[groupId] || [];
        return values.some((value) => projectValues.includes(value));
      });

      return matchesSearch && matchesDynamicFilters;
    });
  }, [projects, search, selectedFilters]);

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[32px] border border-white/5 bg-zinc-950/40 lg:flex-row lg:items-stretch">
      <div className="border-b border-white/5 p-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-left text-white"
        >
          <span className="font-bold">Filtros</span>
          <span
            className={`transition-transform duration-300 ${
              mobileFiltersOpen ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </button>

        <div
          className={`grid transition-all duration-300 ${
            mobileFiltersOpen
              ? "mt-3 grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-3">
              {filtersLoading ? (
                <p className="pt-3 text-sm text-zinc-400">
                  Carregando filtros...
                </p>
              ) : sidebarItems.length > 0 ? (
                sidebarItems.map((item) => (
                  <SidebarFilterItem
                    key={item.id}
                    item={item}
                    selectedFilters={selectedFilters[item.id] || []}
                    onToggle={handleToggleFilter}
                  />
                ))
              ) : (
                <p className="pt-3 text-sm text-zinc-400">
                  Nenhum filtro disponível.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden h-full lg:flex lg:w-[280px] lg:flex-col lg:border-r lg:border-white/5 lg:bg-zinc-950 lg:p-6 xl:w-[300px] xl:p-8">
        <p className="mb-4 font-bold text-white">Filtrar</p>

        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          {filtersLoading ? (
            <p className="text-sm text-zinc-400">Carregando filtros...</p>
          ) : sidebarItems.length > 0 ? (
            sidebarItems.map((item) => (
              <SidebarFilterItem
                key={item.id}
                item={item}
                selectedFilters={selectedFilters[item.id] || []}
                onToggle={handleToggleFilter}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-400">Nenhum filtro disponível.</p>
          )}
        </div>
      </aside>

      <main className="flex h-full min-h-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[320px]">
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-full bg-zinc-800 px-4 pr-10 text-sm text-white placeholder:text-zinc-400 outline-none transition focus:ring-2 focus:ring-zinc-600"
            />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0a7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={fetchProjects}
              disabled={loading}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-white/70 transition hover:bg-zinc-700 disabled:opacity-50"
            >
              <span className={loading ? "animate-spin" : ""}>⟳</span>
            </button>

            <a
              href="/login"
              className="flex h-11 min-w-[88px] items-center justify-center rounded-full bg-zinc-800 px-4 font-bold text-white transition hover:bg-zinc-700"
            >
              Admin
            </a>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {loading ? (
              <p className="text-sm text-zinc-400">Carregando projetos...</p>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <a
                  key={project.id}
                  href={project.project_url || project.github_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-[18px] border border-zinc-800 bg-zinc-900 transition hover:-translate-y-1 hover:border-zinc-600"
                >
                  <div className="flex h-12 items-center border-b border-zinc-700 bg-zinc-700/90 px-3 sm:px-4">
                    <h3 className="truncate text-xs font-semibold text-white sm:text-sm">
                      {project.title}
                    </h3>
                  </div>

                  <div className="aspect-[16/11] bg-zinc-800">
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt={`Preview do projeto ${project.title}`}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
                        Sem imagem
                      </div>
                    )}
                  </div>
                </a>
              ))
            ) : (
              <p className="text-sm text-zinc-400">
                Nenhum projeto encontrado.
              </p>
            )}
          </div>
        </div>
      </main>
    </section>
  );
}
