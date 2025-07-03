import React from 'react';

export default function OutputTerminal({ output }: { output: string[] }) {
  return (
    <div className="bg-black text-green-400 p-2 h-40 overflow-y-auto font-mono">
      {output.length ? output.map((l,i)=>(<div key={i}>{l}</div>)) : <div className="text-gray-500">No output yet</div>}
    </div>
  );
}