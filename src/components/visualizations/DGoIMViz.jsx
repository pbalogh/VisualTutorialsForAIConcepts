/**
 * DGoIM Modal Knowledge Store Visualizations
 * Interactive components for the tutorial on token-guided AI memory
 */
import React, { useState, useCallback } from 'react'

// ============================================================================
// 1. LAMBDA REDUCTION STEPPER
// ============================================================================

const EXAMPLES = [
  { label: '(λx.x) hello', steps: ['(λx.x) hello', 'hello'] },
  { label: '(λf.λx.f x) (λy.y) z', steps: ['(λf.λx.f x) (λy.y) z', '(λx.(λy.y) x) z', '(λy.y) z', 'z'] },
  { label: '(λx.x x) (λx.x)', steps: ['(λx.x x) (λx.x)', '(λx.x) (λx.x)', '(λx.x)'] },
]

export function LambdaReductionStepper() {
  const [exIdx, setExIdx] = useState(0)
  const [step, setStep] = useState(0)
  const ex = EXAMPLES[exIdx]

  return (
    <div className="bg-gray-900 rounded-xl p-5 font-mono text-sm">
      <div className="flex gap-2 mb-4 flex-wrap">
        {EXAMPLES.map((e, i) => (
          <button key={i} onClick={() => { setExIdx(i); setStep(0) }}
            className={`px-3 py-1 rounded text-xs ${i === exIdx ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {e.label}
          </button>
        ))}
      </div>
      <div className="space-y-1 mb-4">
        {ex.steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-2 transition-opacity ${i <= step ? 'opacity-100' : 'opacity-20'}`}>
            <span className="text-gray-500 w-6 text-right">{i === 0 ? '' : '→'}</span>
            <span className={i === step ? 'text-yellow-300' : 'text-gray-400'}>{s}</span>
            {i === step && i < ex.steps.length - 1 && <span className="text-purple-400 text-xs ml-2">β-reduce</span>}
            {i === step && i === ex.steps.length - 1 && <span className="text-green-400 text-xs ml-2">✓ normal form</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
          className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30">◀ Back</button>
        <button onClick={() => setStep(Math.min(ex.steps.length - 1, step + 1))} disabled={step === ex.steps.length - 1}
          className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-30">Step ▶</button>
        <span className="text-gray-500 text-xs self-center ml-2">Step {step}/{ex.steps.length - 1}</span>
      </div>
    </div>
  )
}

// ============================================================================
// 2. MODAL WORLD EXPLORER — Token traversal through nested !-boxes
// ============================================================================

const WORLD_DATA = {
  id: 'W₀', modality: 'ACTUAL', color: '#10b981',
  facts: [
    { s: 'Tom', p: 'isa', o: 'Person', conf: 0.99 },
    { s: 'Mary', p: 'isa', o: 'Person', conf: 0.99 },
    { s: 'water', p: 'freezes_at', o: '0°C', conf: 0.99 },
  ],
  children: [
    {
      id: 'W₁', modality: 'EPISTEMIC(Tom)', color: '#3b82f6',
      facts: [{ s: 'meeting', p: 'time', o: '3pm', conf: 0.85 }],
      refs: ['Tom', 'meeting'], children: []
    },
    {
      id: 'W₂', modality: 'EPISTEMIC(Mary)', color: '#8b5cf6',
      facts: [{ s: 'meeting', p: 'time', o: '4pm', conf: 0.80 }],
      refs: ['Mary', 'meeting'], children: []
    },
    {
      id: 'W₃', modality: 'FICTIONAL(Cat\'s Cradle)', color: '#f59e0b',
      facts: [{ s: 'ice_nine', p: 'freezes_at', o: 'room_temp', conf: 1.0 }],
      refs: ['water'], children: []
    },
  ]
}

const QUERIES = [
  { label: 'When is the meeting?', pattern: { s: 'meeting', p: 'time', o: '?' } },
  { label: 'What freezes?', pattern: { s: '?', p: 'freezes_at', o: '?' } },
  { label: 'Who is a person?', pattern: { s: '?', p: 'isa', o: 'Person' } },
]

function matchFact(fact, pattern) {
  return (pattern.s === '?' || pattern.s === fact.s) &&
         (pattern.p === '?' || pattern.p === fact.p) &&
         (pattern.o === '?' || pattern.o === fact.o)
}

function findResults(world, pattern) {
  const results = []
  world.facts.forEach(f => {
    if (matchFact(f, pattern)) results.push({ ...f, world: world.id, modality: world.modality })
  })
  world.children.forEach(c => results.push(...findResults(c, pattern)))
  return results
}

export function ModalWorldExplorer() {
  const [qIdx, setQIdx] = useState(0)
  const [tokenWorld, setTokenWorld] = useState(null)
  const [results, setResults] = useState([])
  const [boxStack, setBoxStack] = useState([])

  const runQuery = useCallback((idx) => {
    setQIdx(idx)
    setTokenWorld(null)
    setBoxStack([])
    setResults(findResults(WORLD_DATA, QUERIES[idx].pattern))
  }, [])

  const enterWorld = useCallback((world) => {
    setTokenWorld(world.id)
    setBoxStack(prev => [...prev, world.id])
  }, [])

  const exitWorld = useCallback(() => {
    setBoxStack(prev => prev.slice(0, -1))
    setTokenWorld(boxStack.length > 1 ? boxStack[boxStack.length - 2] : null)
  }, [boxStack])

  const WorldBox = ({ world, depth = 0 }) => {
    const isActive = tokenWorld === world.id
    const hasMatch = results.some(r => r.world === world.id)
    return (
      <div className={`border-2 border-dashed rounded-lg p-3 mt-2 transition-all ${isActive ? 'border-yellow-400 bg-yellow-400/10' : hasMatch ? 'border-green-400/50 bg-green-400/5' : 'border-gray-600'}`}
        style={{ marginLeft: depth * 8 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: world.color + '33', color: world.color }}>
              {world.id}
            </span>
            <span className="text-xs text-gray-400">{world.modality}</span>
          </div>
          <button onClick={() => isActive ? exitWorld() : enterWorld(world)}
            className={`text-xs px-2 py-0.5 rounded ${isActive ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {isActive ? '↓ Exit' : '↑ Enter'}
          </button>
        </div>
        <div className="space-y-1">
          {world.facts.map((f, i) => {
            const matched = results.some(r => r.world === world.id && r.s === f.s && r.p === f.p)
            return (
              <div key={i} className={`text-xs font-mono px-2 py-1 rounded ${matched ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
                ({f.s}, {f.p}, {f.o}) <span className="text-gray-500">κ={f.conf}</span>
                {matched && <span className="text-green-400 ml-1">✓ match</span>}
              </div>
            )
          })}
        </div>
        {world.refs && world.refs.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">refs → {world.refs.join(', ')}</div>
        )}
        {world.children.map(c => <WorldBox key={c.id} world={c} depth={depth + 1} />)}
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 text-sm">
      <div className="flex gap-2 mb-4 flex-wrap">
        {QUERIES.map((q, i) => (
          <button key={i} onClick={() => runQuery(i)}
            className={`px-3 py-1 rounded text-xs ${i === qIdx && results.length > 0 ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {q.label}
          </button>
        ))}
      </div>
      {results.length > 0 && (
        <div className="mb-3 text-xs text-gray-400">
          Pattern: <span className="text-emerald-400 font-mono">({QUERIES[qIdx].pattern.s}, {QUERIES[qIdx].pattern.p}, {QUERIES[qIdx].pattern.o})</span>
          {' · '}{results.length} result{results.length !== 1 ? 's' : ''}
        </div>
      )}
      {boxStack.length > 0 && (
        <div className="mb-3 text-xs">
          <span className="text-gray-500">Box stack: </span>
          <span className="text-yellow-300 font-mono">[{boxStack.join(' → ')}]</span>
        </div>
      )}
      <WorldBox world={WORLD_DATA} />
      {results.length > 0 && (
        <div className="mt-4 border-t border-gray-700 pt-3">
          <div className="text-xs text-gray-400 mb-2">Results:</div>
          {results.map((r, i) => (
            <div key={i} className="text-xs font-mono bg-gray-800 rounded px-2 py-1 mb-1">
              <span className="text-green-300">({r.s}, {r.p}, {r.o})</span>
              <span className="text-gray-500"> [{r.modality}, κ={r.conf}]</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 3. FACT PROMOTION SIMULATOR
// ============================================================================

const CONV_FACTS = [
  { s: 'cats_cradle', p: 'author', o: 'vonnegut', conf: 0.85, perm: 0.95, scope: 0.9, srcQ: 0.7, density: 0.85 },
  { s: 'frank', p: 'seemed', o: 'excited', conf: 0.70, perm: 0.1, scope: 0.1, srcQ: 0.5, density: 0.2 },
  { s: 'ice_nine', p: 'from', o: 'cats_cradle', conf: 0.90, perm: 0.9, scope: 0.8, srcQ: 0.7, density: 0.8 },
  { s: 'meeting', p: 'moved_to', o: 'tuesday', conf: 0.75, perm: 0.15, scope: 0.3, srcQ: 0.6, density: 0.4 },
]

export function FactPromotionSim() {
  const [threshold, setThreshold] = useState(0.6)
  const [promoted, setPromoted] = useState(new Set())

  const score = (f) => (f.perm * 0.3 + f.scope * 0.3 + f.srcQ * 0.2 + f.density * 0.2)

  const togglePromote = (i) => {
    setPromoted(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 text-sm">
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs text-gray-400">Promotion threshold:</label>
        <input type="range" min="0" max="1" step="0.05" value={threshold}
          onChange={e => setThreshold(parseFloat(e.target.value))}
          className="w-32" />
        <span className="text-xs text-emerald-400 font-mono">{threshold.toFixed(2)}</span>
      </div>
      <div className="grid gap-2">
        {CONV_FACTS.map((f, i) => {
          const s = score(f)
          const above = s >= threshold
          const isProm = promoted.has(i)
          return (
            <div key={i} className={`rounded-lg p-3 border transition-all ${isProm ? 'border-emerald-400 bg-emerald-900/20' : above ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-700 bg-gray-800'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-gray-300">({f.s}, {f.p}, {f.o})</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${above ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.toFixed(2)} {above ? '✓' : '✗'}
                  </span>
                  <button onClick={() => togglePromote(i)}
                    className={`text-xs px-2 py-0.5 rounded ${isProm ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    {isProm ? '→σ promoted' : 'promote'}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                {[['perm', f.perm], ['scope', f.scope], ['srcQ', f.srcQ], ['density', f.density]].map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1">
                    <span className="text-gray-500">{k}:</span>
                    <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${v * 100}%`, backgroundColor: v > 0.6 ? '#10b981' : v > 0.3 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {promoted.size > 0 && (
        <div className="mt-3 text-xs text-gray-400 border-t border-gray-700 pt-2">
          Promoted to W₀: {[...promoted].map(i => `(${CONV_FACTS[i].s}, ${CONV_FACTS[i].p}, ${CONV_FACTS[i].o})`).join(', ')}
          <span className="text-gray-500"> · C₁ → C₂ for each shared entity</span>
        </div>
      )}
    </div>
  )
}

export default { LambdaReductionStepper, ModalWorldExplorer, FactPromotionSim }
