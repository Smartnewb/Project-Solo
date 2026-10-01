import {fireEvent,screen,waitFor} from '@testing-library/react';
export function heroSelectTrigger(label:string,index=0){
 const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const candidates=screen.getAllByRole('button',{name:new RegExp(escaped)});
 const trigger=candidates[index];
 if(!trigger)throw new Error(`HeroUI select missing: ${label}`);
 return trigger;
}
/** Selects through the actual HeroUI popover, rather than changing its hidden input. */
export async function selectHeroValue(label:string,value:string|number,index=0){
 fireEvent.click(heroSelectTrigger(label,index));
 await screen.findByRole('listbox');
 const option=Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(node=>node.dataset.key===String(value));
 if(!option)throw new Error(`HeroUI option missing: ${label}=${value}`);
 fireEvent.click(option);
 if(screen.queryByRole('listbox'))fireEvent.keyDown(option,{key:'Escape'});
 await waitFor(()=>{if(screen.queryByRole('listbox'))throw new Error('Popover still open');});
}
