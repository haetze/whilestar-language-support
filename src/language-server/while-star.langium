grammar WhileStar

entry Model:
    'vars:' scope=Scope
    ('pre:'  '(' BooleanExpression ')' )?
    'code:' (code+=Statement)*
    ('post:'  '(' BooleanExpression ')' )?;


Scope: NoInitScope |WithInitScope;
WithInitScope : ('int' vars+=TypeWithInit)*;

//STOP
TypeWithInit:
    // Now each variant may have an optional initializer
    name=ID initializer=Initializer ';'
  | '*'+ name=ID initializer=Initializer ';'
  | '[' size=INT ']' name=ID initializer=Initializer ';'
;

// An initializer starts with ':=' and can be one of multiple forms
Initializer:
    ':=' ( SingleValueLiteral
         | RangeLiteral
         | ArrayLiteral
         )
;

// 1) Single number/expression
SingleValueLiteral:
    ArithmeticExpression
;

// 2) Range
RangeLiteral:
    left=ArithmeticExpression '..' right=ArithmeticExpression
;

// 3) Array of arithmetic expressions
ArrayLiteral:
     '[' (items+=SingleValueLiteral | items+=RangeLiteral) (',' (items+=SingleValueLiteral | items+=RangeLiteral))* ']'
;



NoInitScope :
  ('int' vars+=Type)*;

Type:
  name=ID ';'|
  '*'+ name=ID ';'|
  '[' size=INT ']' name=ID ';';


AddressExpression:
  '*'* name=ID ('[' pos=ArithmeticExpression ']')?;

ArithmeticAtom:
  INT |
  AddressExpression |
  '&' name=ID;

ArithmeticExpression:
  ArithmeticAtom |
  '-' ArithmeticAtom |
  left='-'?ArithmeticAtom ('+' | '-' | '*' | '/' | '%') right=ArithmeticAtom |
  '(' left=ArithmeticExpression ')' ('+' | '-' | '*' | '/' | '%') right=ArithmeticAtom |
  left='-'?ArithmeticAtom ('+' | '-' | '*' | '/' | '%') '(' right=ArithmeticExpression ')' |
  '(' left=ArithmeticExpression ')' ('+' | '-' | '*' | '/' | '%') '(' right=ArithmeticExpression ')';



BooleanAtom:
  value='true' |
  value='false' |
  '(' inner=BooleanExpression ')' |
  left=ArithmeticExpression ('>' | '<' | '>=' | '<=' | '='+) right=ArithmeticExpression;

ComplexBoolean:
  left=BooleanAtom ('and' | 'or' | '=>' | '<=>') right=BooleanAtom;

Negation:
  'not' neg=BooleanAtom;

BooleanExpression:
  ComplexBoolean |
  Negation |
  BooleanAtom;

Statement:
  left=AddressExpression ':=' right=(ArithmeticExpression) ';' |
  'swap' left=AddressExpression 'and' right=AddressExpression ';' |
  'while' '(' cond=BooleanExpression ')' ('invariant' '(' inv=BooleanExpression ')')? '{' body+=Statement* '}' ';' |
  'if' '(' cond=BooleanExpression ')' '{' then+=Statement* '}' 'else' '{' else+=Statement* '}' ';' |
  'print' STRING (',' values+=AddressExpression)* ';' |
  'fail' STRING ';' |
  'extern' var=AddressExpression lower='-'? INT '..' upper='-'? INT ';' ;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /\"[^\"\n\r]*\"/;

// hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
// hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
