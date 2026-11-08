import { Children, createElement, isValidElement, type HTMLAttributes, type ReactNode } from 'react';

/** Align DOM/focus order with saved visual order while keeping unrelated chrome in place. */
export default function OrderedSections({ as = 'div', order, children, ...props }: {
  as?: 'div' | 'main';
  order: readonly string[];
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const nodes = Children.toArray(children);
  const isSection = (node: ReactNode) => isValidElement<{ id?: string }>(node) && order.includes(node.props.id ?? '');
  const sections = nodes.filter(isSection).sort((a, b) => {
    const id = (node: ReactNode) => isValidElement<{ id?: string }>(node) ? node.props.id ?? '' : '';
    return order.indexOf(id(a)) - order.indexOf(id(b));
  });
  let next = 0;
  return createElement(as, props, nodes.map((node) => isSection(node) ? sections[next++] : node));
}
