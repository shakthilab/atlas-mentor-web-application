import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[appRowActions]',
  standalone: true,
})
export class TableRowActionsDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
