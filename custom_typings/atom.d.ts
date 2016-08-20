declare module 'atom' {
  export class CompositeDisposable {
    add(d: AtomCore.Disposable): void;
    dispose(): void;
  }
}

