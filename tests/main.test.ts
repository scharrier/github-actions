import { stdout } from 'stdout-stderr';
import * as process from 'process';
stdout.start();

// Load main file (which will try a first executiong of the Action code)
import main from '../src/main';

// Mock internal diff code
import * as diff from '../src/diff';
jest.mock('../src/diff');
const mockedInternalDiff = diff as jest.Mocked<typeof diff>;
import { Repo } from '../src/github';
jest.mock('../src/github');
const mockedInternalRepo = jest.mocked(Repo, true);

// Mock the Bump CLI commands
import * as bump from 'bump-cli';
jest.mock('bump-cli');
const mockedDeploy = bump.Deploy as jest.Mocked<typeof bump.Deploy>;
const mockedDiff = jest.mocked(bump.Diff, true);
const mockedPreview = bump.Preview as jest.Mocked<typeof bump.Preview>;

import * as core from '@actions/core';

const diffExample: bump.DiffResponse = {
  id: 'hello-123',
  markdown: 'one',
  public_url: 'https://bump.sh/doc/my-doc/changes/654',
  breaking: true,
};

beforeEach(() => {
  stdout.stop();
  stdout.start();
  mockedInternalRepo.prototype.getBaseFile.mockReset();
});
afterEach(() => stdout.stop());

describe('deploy', () => {
  it('runs deploy correctly', async () => {
    expect(mockedDeploy.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file.yml',
      INPUT_DOC: 'my-doc',
      INPUT_TOKEN: 'SECRET',
    });

    await main();

    restore();

    expect(mockedDeploy.run).toHaveBeenCalledWith([
      'my-file.yml',
      '--token',
      'SECRET',
      '--doc',
      'my-doc',
    ]);
  });

  it('runs deploy entire directory in hub correctly', async () => {
    expect(mockedDeploy.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file.yml',
      INPUT_HUB: 'my-hub',
      INPUT_TOKEN: 'SECRET',
    });

    await main();

    restore();

    expect(mockedDeploy.run).toHaveBeenCalledWith([
      'my-file.yml',
      '--token',
      'SECRET',
      '--auto-create',
      '--hub',
      'my-hub',
    ]);
  });

  it('runs deploy a specific doc inside a hub correctly', async () => {
    expect(mockedDeploy.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file.yml',
      INPUT_DOC: 'my-doc',
      INPUT_HUB: 'my-hub',
      INPUT_TOKEN: 'SECRET',
    });

    await main();

    restore();

    expect(mockedDeploy.run).toHaveBeenCalledWith([
      'my-file.yml',
      '--token',
      'SECRET',
      '--doc',
      'my-doc',
      '--hub',
      'my-hub',
    ]);
  });

  it('runs deploy with branch name correctly', async () => {
    expect(mockedDeploy.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file.yml',
      INPUT_DOC: 'my-doc',
      INPUT_TOKEN: 'SECRET',
      INPUT_BRANCH: 'latest',
    });

    await main();

    restore();

    expect(mockedDeploy.run).toHaveBeenCalledWith([
      'my-file.yml',
      '--token',
      'SECRET',
      '--doc',
      'my-doc',
      '--branch',
      'latest',
    ]);
  });

  it('passes a single overlay correctly', async () => {
    expect(mockedDeploy.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file.yml',
      INPUT_DOC: 'my-doc',
      INPUT_TOKEN: 'SECRET',
      INPUT_OVERLAY: 'overlay1.yml',
    });

    await main();

    restore();

    expect(mockedDeploy.run).toHaveBeenCalledWith([
      'my-file.yml',
      '--token',
      'SECRET',
      '--doc',
      'my-doc',
      '--overlay',
      'overlay1.yml',
    ]);
  });

  it('passes a single overlay with URL correctly', async () => {
    expect(mockedDeploy.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file.yml',
      INPUT_DOC: 'my-doc',
      INPUT_TOKEN: 'SECRET',
      INPUT_OVERLAY:
        'https://spec.speakeasy.com/protectearth/protectearth/train-travel-api-typescript-code-samples',
    });

    await main();

    restore();

    expect(mockedDeploy.run).toHaveBeenCalledWith([
      'my-file.yml',
      '--token',
      'SECRET',
      '--doc',
      'my-doc',
      '--overlay',
      'https://spec.speakeasy.com/protectearth/protectearth/train-travel-api-typescript-code-samples',
    ]);
  });

  it('passes multiple overlays correctly', async () => {
    expect(mockedDeploy.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file.yml',
      INPUT_DOC: 'my-doc',
      INPUT_TOKEN: 'SECRET',
      INPUT_OVERLAY: 'overlay1.yml,overlay2.yml',
    });

    await main();

    restore();

    expect(mockedDeploy.run).toHaveBeenCalledWith([
      'my-file.yml',
      '--token',
      'SECRET',
      '--doc',
      'my-doc',
      '--overlay',
      'overlay1.yml',
      '--overlay',
      'overlay2.yml',
    ]);
  });
});

describe('preview', () => {
  it('runs preview correctly', async () => {
    expect(mockedPreview.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file-to-preview.yml',
      INPUT_COMMAND: 'preview',
    });

    await main();

    restore();

    expect(mockedPreview.run).toHaveBeenCalledWith(['my-file-to-preview.yml']);
  });

  it('runs dry-run correctly', async () => {
    expect(mockedDeploy.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file.yml',
      INPUT_DOC: 'my-doc',
      INPUT_TOKEN: 'SECRET',
      INPUT_COMMAND: 'dry-run',
    });

    await main();

    restore();

    expect(mockedDeploy.run).toHaveBeenCalledWith([
      'my-file.yml',
      '--token',
      'SECRET',
      '--doc',
      'my-doc',
      '--dry-run',
    ]);
  });
});

describe('diff', () => {
  it('runs diff correctly', async () => {
    mockedDiff.prototype.run.mockResolvedValue(diffExample);
    expect(mockedDiff.prototype.run).not.toHaveBeenCalled();
    expect(mockedInternalDiff.run).not.toHaveBeenCalled();
    expect(mockedInternalRepo).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file-to-diff.yml',
      INPUT_COMMAND: 'diff',
    });
    const emptyDocDigest = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';

    await main();

    expect(mockedInternalRepo).toHaveBeenCalledWith(emptyDocDigest);
    expect(mockedInternalRepo.prototype.getBaseFile).toHaveBeenCalledWith(
      process.env.INPUT_FILE,
    );

    restore();

    expect(mockedDiff.prototype.run).toHaveBeenCalledWith(
      'my-file-to-diff.yml',
      undefined,
      '',
      '',
      '',
      '',
      'markdown',
      '',
    );
    expect(mockedInternalDiff.run).toHaveBeenCalledWith(diffExample, expect.any(Repo));
  });

  it('runs diff on existing documentation correctly', async () => {
    mockedDiff.prototype.run.mockResolvedValue(diffExample);
    expect(mockedDiff.prototype.run).not.toHaveBeenCalled();
    expect(mockedInternalDiff.run).not.toHaveBeenCalled();
    expect(mockedInternalRepo).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file-to-diff.yml',
      INPUT_DOC: 'my-doc',
      INPUT_COMMAND: 'diff',
    });
    const docDigest = '398b995591d7e5f6676e44f06be071abe850b38e';

    await main();

    expect(mockedInternalRepo).toHaveBeenCalledWith(docDigest);
    expect(mockedInternalRepo.prototype.getBaseFile).toHaveBeenCalledWith(
      process.env.INPUT_FILE,
    );

    restore();

    expect(mockedDiff.prototype.run).toHaveBeenCalledWith(
      'my-file-to-diff.yml',
      undefined,
      'my-doc',
      '',
      '',
      '',
      'markdown',
      '',
    );
    expect(mockedInternalDiff.run).toHaveBeenCalledWith(diffExample, expect.any(Repo));
  });

  it('runs diff with Branch correctly', async () => {
    mockedDiff.prototype.run.mockResolvedValue(diffExample);
    expect(mockedDiff.prototype.run).not.toHaveBeenCalled();
    expect(mockedInternalDiff.run).not.toHaveBeenCalled();
    expect(mockedInternalRepo).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file-to-diff.yml',
      INPUT_COMMAND: 'diff',
      INPUT_BRANCH: 'latest',
    });

    await main();

    expect(mockedInternalRepo.prototype.getBaseFile).toHaveBeenCalledWith(
      process.env.INPUT_FILE,
    );

    restore();

    expect(mockedDiff.prototype.run).toHaveBeenCalledWith(
      'my-file-to-diff.yml',
      undefined,
      '',
      '',
      'latest',
      '',
      'markdown',
      '',
    );
    expect(mockedInternalDiff.run).toHaveBeenCalledWith(diffExample, expect.any(Repo));
  });

  it('runs diff on PR correctly', async () => {
    mockedDiff.prototype.run.mockResolvedValue(diffExample);
    expect(mockedDiff.prototype.run).not.toHaveBeenCalled();
    expect(mockedInternalDiff.run).not.toHaveBeenCalled();
    mockedInternalRepo.prototype.getBaseFile.mockResolvedValue(
      'my-base-file-to-diff.yml',
    );

    const restore = mockEnv({
      INPUT_FILE: 'my-file-to-diff.yml',
      INPUT_COMMAND: 'diff',
    });

    await main();

    restore();

    expect(mockedDiff.prototype.run).toHaveBeenCalledWith(
      'my-base-file-to-diff.yml',
      'my-file-to-diff.yml',
      '',
      '',
      '',
      '',
      'markdown',
      '',
    );
    expect(mockedInternalDiff.run).toHaveBeenCalledWith(diffExample, expect.any(Repo));
  });

  it('runs with breaking change diff', async () => {
    const spyError = jest.spyOn(core, 'setFailed');

    mockedDiff.prototype.run.mockResolvedValue(diffExample);
    expect(mockedDiff.prototype.run).not.toHaveBeenCalled();
    expect(mockedInternalDiff.run).not.toHaveBeenCalled();
    mockedInternalDiff.run.mockResolvedValue();
    mockedInternalRepo.prototype.getBaseFile.mockResolvedValue(
      'my-base-file-to-diff.yml',
    );

    const restore = mockEnv({
      INPUT_FILE: 'my-file-to-diff.yml',
      INPUT_COMMAND: 'diff',
      INPUT_FAIL_ON_BREAKING: 'true',
    });

    await main();

    restore();

    expect(spyError).toHaveBeenCalledWith(
      expect.stringMatching(
        'Failing due to a breaking change detected in your API diff.',
      ),
    );

    expect(mockedDiff.prototype.run).toHaveBeenCalledWith(
      'my-base-file-to-diff.yml',
      'my-file-to-diff.yml',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      'markdown',
      expect.anything(),
    );
    expect(mockedInternalDiff.run).toHaveBeenCalledWith(diffExample, expect.any(Repo));
  });

  it('runs diff with internal exception', async () => {
    const spyError = jest.spyOn(core, 'setFailed');

    mockedDiff.prototype.run.mockResolvedValue(diffExample);
    expect(mockedDiff.prototype.run).not.toHaveBeenCalled();
    mockedInternalDiff.run.mockRejectedValue(new Error('Boom'));
    expect(mockedInternalDiff.run).not.toHaveBeenCalled();

    const restore = mockEnv({
      INPUT_FILE: 'my-file-to-diff.yml',
      INPUT_COMMAND: 'diff',
    });

    await main();

    restore();

    expect(spyError).toHaveBeenCalledWith('Boom');

    expect(mockedDiff.prototype.run).toHaveBeenCalledWith(
      'my-file-to-diff.yml',
      undefined,
      '',
      '',
      '',
      '',
      'markdown',
      '',
    );
    expect(mockedInternalDiff.run).toHaveBeenCalledWith(diffExample, expect.any(Repo));
  });

  it('runs diff with no change', async () => {
    const spyInfo = jest.spyOn(core, 'info');

    mockedDiff.prototype.run.mockResolvedValue(undefined);
    expect(mockedDiff.prototype.run).not.toHaveBeenCalled();
    expect(mockedInternalDiff.run).not.toHaveBeenCalled();
    mockedInternalRepo.prototype.getBaseFile.mockResolvedValue(
      'my-base-file-to-diff.yml',
    );

    const restore = mockEnv({
      INPUT_FILE: 'my-file-to-diff.yml',
      INPUT_COMMAND: 'diff',
      INPUT_FAIL_ON_BREAKING: 'true',
    });

    await main();

    restore();

    expect(spyInfo).toHaveBeenCalledWith(
      expect.stringMatching('No changes detected, nothing more to do.'),
    );

    expect(mockedDiff.prototype.run).toHaveBeenCalledWith(
      'my-base-file-to-diff.yml',
      'my-file-to-diff.yml',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      'markdown',
      expect.anything(),
    );
    expect(mockedInternalDiff.run).not.toHaveBeenCalled();
  });
});
