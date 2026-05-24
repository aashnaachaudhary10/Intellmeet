import { useEffect, useState } from "react";
import { FileText, FolderOpen, LoaderCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DOCS_ROOT_PATH, getDocContent, getProjectDocs, type FileListItem } from "@/services/api";

type DocFile = FileListItem & {
  fullPath: string;
};

export default function Docs() {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [content, setContent] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDocs = async () => {
      setLoadingList(true);
      setError("");

      try {
        const response = await getProjectDocs();
        const markdownFiles = response.data.files
          .filter((file) => file.type === "file" && file.name.toLowerCase().endsWith(".md"))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((file) => ({
            ...file,
            fullPath: `${DOCS_ROOT_PATH}/${file.name}`
          }));

        setDocs(markdownFiles);
        setSelectedDoc(markdownFiles[0] ?? null);
      } catch (err) {
        setError("Unable to load project documents right now.");
      } finally {
        setLoadingList(false);
      }
    };

    void loadDocs();
  }, []);

  useEffect(() => {
    if (!selectedDoc) {
      setContent("");
      return;
    }

    const loadContent = async () => {
      setLoadingContent(true);
      setError("");

      try {
        const response = await getDocContent(selectedDoc.fullPath);
        setContent(response.data);
      } catch (err) {
        setError(`Unable to open ${selectedDoc.name}.`);
        setContent("");
      } finally {
        setLoadingContent(false);
      }
    };

    void loadContent();
  }, [selectedDoc]);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/20">
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-400">Project Docs</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Markdown Library</h1>
            <p className="mt-2 text-sm text-slate-400">{DOCS_ROOT_PATH}</p>
          </div>

          <div className="p-3">
            {loadingList ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-5 text-sm text-slate-300">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading markdown files...
              </div>
            ) : docs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
                No markdown files were found in the project root.
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map((doc) => {
                  const isActive = selectedDoc?.fullPath === doc.fullPath;

                  return (
                    <button
                      key={doc.fullPath}
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-cyan-400/60 bg-cyan-500/10 text-white"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80"
                      }`}
                    >
                      <FileText className={`h-4 w-4 ${isActive ? "text-cyan-300" : "text-slate-500"}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-slate-500">
                          {doc.size ? `${Math.ceil(doc.size / 1024)} KB` : "Text file"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top,#164e63_0%,#020617_38%,#020617_100%)] shadow-2xl shadow-cyan-950/20">
          <div className="border-b border-slate-800/80 bg-slate-950/40 px-6 py-5">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {selectedDoc?.name || "Select a document"}
                </h2>
                <p className="text-sm text-slate-400">
                  Files are loaded from the project root through the backend file APIs.
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-[70vh] px-6 py-6">
            {loadingContent ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-5 text-sm text-slate-300">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Opening document...
              </div>
            ) : selectedDoc ? (
              <article className="prose prose-invert prose-slate max-w-none rounded-2xl border border-slate-800 bg-slate-950/55 p-6 prose-headings:text-white prose-p:text-slate-200 prose-strong:text-white prose-code:text-cyan-200 prose-pre:border prose-pre:border-slate-800 prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-a:text-cyan-300 prose-li:text-slate-200 prose-blockquote:border-cyan-400/50 prose-blockquote:text-slate-300 prose-th:text-white prose-td:text-slate-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-10 text-center text-slate-400">
                Choose a markdown file from the left to open it here.
              </div>
            )}

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
