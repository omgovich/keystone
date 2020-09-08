/** @jsx jsx */

import { jsx } from '@emotion/core';
import { ReactEditor, useSlate } from 'slate-react';
import { Editor, Node, Transforms, Path, Range } from 'slate';

import { Button } from './components';
import { useDocumentFeatures } from './documentFeatures';
import { isBlockTextEmpty, getBlockAboveSelection, isBlockActive } from './utils';

// Access Boundary
export const isInsideAccessBoundary = editor => {
  return isBlockActive(editor, 'access-boundary');
};
export const insertAccessBoundary = editor => {
  if (isInsideAccessBoundary(editor)) return;
  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const [block] = getBlockAboveSelection(editor);
  if (block && isCollapsed && isBlockTextEmpty(block)) {
    const element = { type: 'access-boundary', roles: [], children: [] };
    Transforms.wrapNodes(editor, element);
  } else {
    const children = [{ type: 'paragraph', children: [{ text: '' }] }];
    const element = { type: 'access-boundary', roles: [], children };
    Transforms.insertNodes(editor, element, { select: true });
  }
};

export const withAccess = editor => {
  const { insertBreak, deleteBackward } = editor;
  editor.insertBreak = () => {
    const [block] = getBlockAboveSelection(editor);

    if (block && isBlockTextEmpty(block)) {
      const accessBoundary = Editor.above(editor, {
        match: n => n.type === 'access-boundary',
      });

      if (accessBoundary) {
        const [, path] = accessBoundary;
        Transforms.insertNodes(
          editor,
          { type: 'paragraph', children: [{ text: '' }] },
          {
            at: Path.next(path),
            select: true,
          }
        );
        return;
      }
    }

    insertBreak();
  };

  editor.deleteBackward = unit => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const accessBoundaryNode = Editor.above(editor, { match: n => n.type === 'access-boundary' });
      if (accessBoundaryNode) {
        const [node, path] = accessBoundaryNode;
        const content = Node.string(node);

        // Remove the AccessBoundary Node if there's no content
        if (!content) {
          // NOTE: If the node is the last node in the root (editor), removing it throws an exception.
          // Ref: https://github.com/ianstormtaylor/slate/issues/3834).
          // To mitigate this problem, we are inserting an empty paragraph element.
          Transforms.removeNodes(editor, { at: path, hanging: true });
          //Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] });
          return;
        }
      }
    }
    deleteBackward(unit);
  };
  return editor;
};

export const AccessBoundaryElement = ({ attributes, children, element }) => {
  const editor = useSlate();
  const { access } = useDocumentFeatures();
  const elementRoles = Array.isArray(element.roles) ? element.roles : [];
  // TODO: handle case where no access or roles are defined
  // TODO: validate elementRoles against defined access roles
  return (
    <div
      css={{
        margin: '8px 0',
        border: '3px dashed #E2E8F0',
        borderRadius: 5,
      }}
      {...attributes}
    >
      <div
        contentEditable={false}
        style={{
          userSelect: 'none',
          backgroundColor: '#F7FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: 8,
          fontSize: 14,
          color: '#E53E3E',
          fontWeight: 600,
        }}
      >
        <span css={{ marginRight: 8 }}>Restrict to:</span>
        {access.roles.map(role => {
          const roleIsSelected = elementRoles.includes(role.value);
          return (
            <Button
              key={role.value}
              isPressed={roleIsSelected}
              onMouseDown={event => {
                event.preventDefault();
                const path = ReactEditor.findPath(editor, element);
                const newRoles = roleIsSelected
                  ? elementRoles.filter(i => i !== role.value)
                  : [...elementRoles, role.value];
                Transforms.setNodes(editor, { roles: newRoles }, { at: path });
              }}
            >
              {role.label}
            </Button>
          );
        })}
        <Button
          css={{ float: 'right' }}
          onMouseDown={event => {
            event.preventDefault();
            const path = ReactEditor.findPath(editor, element);
            Transforms.unwrapNodes(editor, { at: path });
            Transforms.select(editor, path);
            Transforms.collapse(editor, { edge: 'start' });
          }}
        >
          Remove
        </Button>
      </div>
      <div css={{ margin: 8 }}>{children}</div>
    </div>
  );
};
