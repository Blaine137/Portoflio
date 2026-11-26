import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { ParticleField } from '../../src/components/ParticleField';
import { startParticleScene } from '../../src/lib/particle-scene';
import * as workerClient from '../../src/lib/particle-worker-client';

vi.mock('../../src/lib/particle-scene', () => ({ startParticleScene: vi.fn() }));
const setPaused = vi.fn(),
  dispose = vi.fn();
const preference = {
  matches: true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
const subject = () =>
  render(
    <section>
      <ParticleField />
      <div id="motion-controls" />
    </section>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  preference.matches = true;
  vi.stubGlobal('matchMedia', () => preference);
  vi.mocked(startParticleScene).mockReturnValue({ setPaused, dispose });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('pauses and resumes and switches to the still illustration when motion preferences change', async () => {
  const { container, unmount } = subject();
  fireEvent.click(await screen.findByRole('button', { name: 'Pause animation' }));
  expect(setPaused).toHaveBeenCalledWith(true);
  fireEvent.click(screen.getByRole('button', { name: 'Resume animation' }));
  expect(setPaused).toHaveBeenLastCalledWith(false);
  preference.matches = false;
  await act(async () => preference.addEventListener.mock.calls[0][1]());
  expect(container.querySelector('[data-active="false"]')).not.toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(dispose).toHaveBeenCalledOnce();
  unmount();
  expect(preference.removeEventListener).toHaveBeenCalledOnce();
});

it('shows the still artwork for reduced motion without starting WebGL', () => {
  preference.matches = false;
  const { container } = subject();
  expect(startParticleScene).not.toHaveBeenCalled();
  expect(container.querySelector('.particle-mask')).not.toBeNull();
  expect(
    container.querySelector('canvas')!.closest('[aria-hidden="true"]'),
  ).not.toBeNull();
});

it('recovers from renderer startup failure or loss of WebGL context', async () => {
  vi.mocked(startParticleScene).mockImplementationOnce(() => {
    throw Error('WebGL unavailable');
  });
  subject();
  await waitFor(() => expect(startParticleScene).toHaveBeenCalledOnce());
  expect(screen.queryByRole('button')).toBeNull();
  await act(async () => preference.addEventListener.mock.calls[0][1]());
  await screen.findByRole('button', { name: 'Pause animation' });
  act(() => vi.mocked(startParticleScene).mock.calls[1][2]());
  expect(dispose).toHaveBeenCalled();
  expect(screen.queryByRole('button')).toBeNull();
});

it('discards an import that finishes after the component unmounts', async () => {
  const { unmount } = subject();
  unmount();
  await act(async () => {
    await Promise.resolve();
  });
  expect(startParticleScene).not.toHaveBeenCalled();
});

it('shows controls after the worker draws and recovers once if that worker fails', async () => {
  const worker = vi.spyOn(workerClient, 'startWorkerScene').mockReturnValue({ setPaused, dispose });
  subject();
  const [, , , ready, fail] = worker.mock.calls[0];
  expect(screen.queryByRole('button')).toBeNull();
  act(ready);
  expect(screen.getByRole('button', { name: 'Pause animation' })).toBeTruthy();
  await act(async () => fail());
  expect(startParticleScene).toHaveBeenCalledOnce();
  act(() => { ready(); fail(); });
  expect(startParticleScene).toHaveBeenCalledOnce();
});

it('hydrates server markup before adding the motion control to its footer slot', async () => {
  const markup = <><section><ParticleField /></section><footer><div id="motion-controls" /></footer></>;
  const container = document.createElement('div');
  container.innerHTML = renderToString(markup);
  document.body.appendChild(container);
  expect(container.querySelector('button')).toBeNull();
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const recoverable = vi.fn();
  let root: ReturnType<typeof hydrateRoot>;
  try {
    await act(async () => {
      root = hydrateRoot(container, markup, { onRecoverableError: recoverable });
    });
    await screen.findByRole('button', { name: 'Pause animation' });
    expect(container.querySelector('footer button')).not.toBeNull();
    expect(errors).not.toHaveBeenCalled();
    expect(recoverable).not.toHaveBeenCalled();
  } finally {
    await act(async () => root!.unmount());
    container.remove();
    errors.mockRestore();
  }
});
