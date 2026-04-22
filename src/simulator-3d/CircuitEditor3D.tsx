"use client";

import { COMPONENT_LIBRARY } from "./modelLibrary";
import SceneCanvas from "./components/SceneCanvas";
import { useCircuitEditorStore } from "./store/useCircuitEditorStore";

export default function CircuitEditor3D() {
  const {
    addComponent,
    pendingWire,
    cancelWire,
    wires,
    directConnections,
    components,
    connectionMode,
    setConnectionMode,
  } = useCircuitEditorStore();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbff_0%,#dce9f5_100%)] px-6 py-8 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_60px_rgba(54,84,112,0.18)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-700">3D Circuit Editor</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                Three.js + React Three Fiber foundation for a Tinkercad-style editor
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Drag components on the 3D grid, click one pin and then another to route a curved wire or create a direct
                pin-to-pin snap, and rotate parts with a double click. The editor ships with local fallback meshes, so it
                runs without any external model files.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConnectionMode("wire")}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  connectionMode === "wire"
                    ? "border-sky-600 bg-sky-600 text-white"
                    : "border-slate-300 bg-white text-slate-900 hover:border-sky-500 hover:text-sky-700"
                }`}
              >
                Wire Mode
              </button>
              <button
                type="button"
                onClick={() => setConnectionMode("direct")}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  connectionMode === "direct"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-300 bg-white text-slate-900 hover:border-emerald-500 hover:text-emerald-700"
                }`}
              >
                Direct Snap Mode
              </button>
              {Object.values(COMPONENT_LIBRARY).map((component) => (
                <button
                  key={component.type}
                  type="button"
                  onClick={() => addComponent(component.type)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-sky-500 hover:text-sky-700"
                >
                  Add {component.name}
                </button>
              ))}
              {pendingWire && (
                <button
                  type="button"
                  onClick={cancelWire}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Cancel Wire
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/70 bg-slate-950 p-5 text-slate-100 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <h2 className="text-lg font-semibold">Editor Notes</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <p>1. Component geometry and pin positions live in `src/simulator-3d/modelLibrary.tsx`.</p>
              <p>2. React Three Fiber pointer events are powered by a Three.js raycaster, so pin clicks already use ray hits.</p>
              <p>3. In Direct Snap mode, dropping a part near another pin locks the two pins together with no wire.</p>
              <p>4. Wires and direct links both read component positions from Zustand, so attachments follow dragging.</p>
              <p>5. Double click a component to rotate it by 90 degrees around the Y axis.</p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Live State</p>
              <p className="mt-3 text-sm text-slate-300">Components: {components.length}</p>
              <p className="text-sm text-slate-300">Mode: {connectionMode}</p>
              <p className="text-sm text-slate-300">Wires: {wires.length}</p>
              <p className="text-sm text-slate-300">Direct links: {directConnections.length}</p>
              <p className="text-sm text-slate-300">
                Pending pin: {pendingWire ? `${pendingWire.componentId}:${pendingWire.pinId}` : "none"}
              </p>
            </div>
          </aside>

          <div className="h-[75vh] min-h-[620px]">
            <SceneCanvas />
          </div>
        </div>
      </div>
    </div>
  );
}
