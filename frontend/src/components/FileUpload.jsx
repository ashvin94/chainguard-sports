import { useRef } from "react";

function FileUpload({ file, onFileChange, accept = "*" }) {
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) onFileChange(nextFile);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="glass-card cursor-pointer rounded-2xl border border-dashed border-blue-300/35 p-8 text-center transition hover:border-blue-300/70 hover:bg-blue-500/10"
      >
        <p className="text-lg font-medium">Drag & drop your file here</p>
        <p className="mt-2 text-sm text-slate-300">
          or click to browse from your device
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />
      </div>

      {file ? (
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-slate-200">
            Selected: <span className="font-semibold">{file.name}</span>
          </p>
          {file.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="mt-3 h-48 w-full rounded-lg object-cover"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default FileUpload;
