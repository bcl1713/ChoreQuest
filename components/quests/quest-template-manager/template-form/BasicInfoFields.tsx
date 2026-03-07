import { ChangeEvent } from 'react';

interface BasicInfoFieldsProps {
  title: string;
  description: string;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

export function BasicInfoFields({ title, description, onChange }: BasicInfoFieldsProps) {
  return (
    <>
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-semibold uppercase text-gray-300 mb-1"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          name="title"
          value={title}
          onChange={onChange}
          placeholder="Title"
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-semibold uppercase text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={onChange}
          placeholder="Description"
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2"
          rows={3}
          required
        ></textarea>
      </div>
    </>
  );
}
