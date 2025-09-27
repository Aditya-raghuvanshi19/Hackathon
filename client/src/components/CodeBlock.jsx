
import { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';



const CodeBlock = ({ code, language = 'json', title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCode = (code) => {
    try {
      // If it's JSON, try to pretty-print it
      if (language === 'json' && typeof code === 'string') {
        return JSON.stringify(JSON.parse(code), null, 2);
      }
    } catch (e) {
      // If parsing fails, return the original code
      console.error("Error formatting code:", e);
    }
    return code;
  };

  const formattedCode = formatCode(code);

  return (
    <div className="relative rounded-lg overflow-hidden my-4 bg-secondary">
      {title && (
        <div className="bg-secondary/70 backdrop-blur-sm px-4 py-2 text-xs font-mono text-secondary-foreground border-b border-border">
          {title}
        </div>
      )}
      <pre className="p-4 text-sm font-mono overflow-x-auto">
        <code className={`language-${language}`}>{formattedCode}</code>
      </pre>
      <button 
        className="absolute top-3 right-3 p-2 rounded-md bg-muted/80 hover:bg-muted transition-colors"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy to clipboard"}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
};

export default CodeBlock;
