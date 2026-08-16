import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[appCellDef]',
  standalone: true,
})
export class TableCellDefDirective {
  @Input('appCellDef') column!: string;

  constructor(public templateRef: TemplateRef<any>) {}
}
