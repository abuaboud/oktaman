import { useState, useRef, useCallback } from 'react';
import { Pencil } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type EditableTextProps = {
  value: string | undefined;
  className?: string;
  readonly: boolean;
  onValueChange: (value: string) => void;
  tooltipContent?: string;
  disallowEditingOnClick?: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
};

const EditableText = ({
  value: initialValue,
  className = '',
  readonly = false,
  onValueChange,
  tooltipContent,
  disallowEditingOnClick,
  isEditing,
  setIsEditing,
}: EditableTextProps) => {
  const [value, setValue] = useState(initialValue);
  const isEditingPreviousRef = useRef(isEditing);
  const valueOnEditingStartedRef = useRef(initialValue);
  //detect change coming from outside
  if (value !== initialValue) {
    setValue(initialValue);
  }
  const editableTextRef = useRef<HTMLDivElement>(null);

  const emitChangedValue = useCallback(() => {
    const nodeValue = (editableTextRef.current?.textContent ?? '').trim();
    const shouldUpdateValue =
      nodeValue.length > 0 && nodeValue !== valueOnEditingStartedRef.current;

    setValue(shouldUpdateValue ? nodeValue : valueOnEditingStartedRef.current);
    if (shouldUpdateValue) {
      onValueChange(nodeValue);
    }
  }, [onValueChange, valueOnEditingStartedRef.current]);

  const setSelectionToValue = () => {
    setTimeout(() => {
      if (
        editableTextRef.current &&
        window.getSelection &&
        document.createRange
      ) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editableTextRef.current);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 1);
  };
  if (isEditing && !isEditingPreviousRef.current) {
    valueOnEditingStartedRef.current = value ? value.trim() : '';
    setSelectionToValue();
  }
  isEditingPreviousRef.current = isEditing;

  return !isEditing ? (
    <Tooltip>
      <TooltipTrigger
        disabled={readonly || isEditing}
        asChild
      >
        <div
          onClick={(e) => {
            if (!isEditing && !readonly && !disallowEditingOnClick) {
              setIsEditing(true);
            }
            if(!disallowEditingOnClick){
              e.stopPropagation();
            }
          }}
          ref={editableTextRef}
          key={'viewed'}
          className={`${className} truncate group relative inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
          title={
            editableTextRef.current &&
            editableTextRef.current.scrollWidth >
              editableTextRef.current.clientWidth &&
            value
              ? value
              : ''
          }
        >
          <span className="truncate">{value}</span>
          {!readonly && (
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="font-normal z-50" side="bottom">
        {!readonly ? 'Click to edit' : tooltipContent}
      </TooltipContent>
    </Tooltip>
  ) : (
    <div
      key={'editable'}
      ref={editableTextRef}
      contentEditable
      suppressContentEditableWarning={true}
      className={`${className}  focus:outline-none break-all`}
      onBlur={() => {
        setTimeout(() => {
          if (!editableTextRef.current?.contains(document.activeElement)) {
            emitChangedValue();
            setIsEditing(false);
          }
        }, 100);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setValue(valueOnEditingStartedRef.current);
          setIsEditing(false);
        } else if (event.key === 'Enter') {
          emitChangedValue();
          setIsEditing(false);
        }
      }}
    >
      {value}
    </div>
  );
};

EditableText.displayName = 'EditableText';
export default EditableText;