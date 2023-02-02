import {
  Controller,
  Get,
  Head,
  Param,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import * as fs from 'fs-extra';
import {
  FileMeta,
  FilesOutputService,
} from '@share/modules/files/files-output.service';
import { FileRefRequest } from '@share/modules/files/files_request';

export class ByUidParamDto {
  @IsString()
  @ApiProperty({ default: '' })
  uid: string;
}

export class ByUidAndArgsDto {
  @IsString()
  @ApiProperty({ default: '' })
  uid: string;

  @IsString()
  @ApiProperty({ default: '' })
  args: string;
}

@ApiTags('files refs')
@Controller()
export class FilesController {
  constructor(private filesOutput: FilesOutputService) {}

  parseUid(uidParam: string, query: { [key: string]: string }) {
    let fileRefRequest: FileRefRequest;

    let match = uidParam.match(/^([0-9a-fA-Z]*)(\.(\w+))$/);
    if (match) {
      const uid = match[1];
      fileRefRequest = new FileRefRequest(uid);
      fileRefRequest.format = match[3];
    }

    match = uidParam.match(/^([0-9a-fA-Z]*)(\:(\d+))?$/);
    if (!fileRefRequest && match) {
      const uid = match[1];

      fileRefRequest = new FileRefRequest(uid);

      if (match[3]) {
        const temp = match[3];
        if (!Number.isNaN(temp)) {
          fileRefRequest.thumb = {
            type: 'width',
            name: temp,
          };
        }
      }
    }

    match = uidParam.match(/^([0-9a-fA-Z]*)(\:(fullhd))?$/);
    if (!fileRefRequest && match) {
      const uid = match[1];
      fileRefRequest = new FileRefRequest(uid);
      if (match[3]) {
        fileRefRequest.thumb = {
          type: 'name',
          name: match[3],
        };
      }
    }

    if (!fileRefRequest) {
      fileRefRequest = new FileRefRequest(uidParam);
    }

    if (query.w) {
      fileRefRequest.thumb = {
        type: 'width',
        name: query.w,
      };
    } else if (query.n) {
      fileRefRequest.thumb = {
        type: 'name',
        name: query.n,
      };
    }

    return fileRefRequest;
  }

  getFileRefByUidAndArgsAndQuery(
    uid: string,
    args: string,
    query: { [key: string]: string },
  ) {
    const fileRefRequest = new FileRefRequest(uid);

    const match = args.match(/^(image|video)(\.(\w+))?$/);
    if (match) {
      fileRefRequest.type = match[1] as 'image' | 'video';
      if (match[3]) {
        fileRefRequest.format = match[3];
      }
    }

    if (query.w) {
      fileRefRequest.thumb = {
        type: 'width',
        name: query.w,
      };
    } else if (query.n) {
      fileRefRequest.thumb = {
        type: 'name',
        name: query.n,
      };
    }

    return fileRefRequest;
  }

  getHeadersForFile(fileDbMeta: FileMeta) {
    return {
      'Cache-Control': 'public, immutable',
      'Content-Type': fileDbMeta.mime,
      'Content-Length': fileDbMeta.size,
      'Last-Modified': new Date(fileDbMeta.createdAt).toUTCString(),
      ETag: fileDbMeta.sha256,
    };
  }

  @Head(':uid')
  @ApiOperation({
    summary: ':uid',
    description: 'get data for file ref by uid',
  })
  async headByUid(
    @Param() params: ByUidParamDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const uid = req.params['uid'];
    const query = req.query as { [key: string]: string };
    const fileRefRequest = this.parseUid(uid, query);

    const fileRes = await this.filesOutput.getFileDbPathByFileRefRequest(
      fileRefRequest,
    );

    const ipfsCacheItemHeaders = this.getHeadersForFile(fileRes.fileMeta);
    res.status(fileRes.status).set(ipfsCacheItemHeaders);
    res.send('');
  }

  @Get(':uid')
  @ApiOperation({
    summary: ':uid',
    description: 'get data for file ref by uid',
  })
  async getByUid(
    @Param() params: ByUidParamDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    console.log('getByUid', req.params['uid']);

    const uid = req.params['uid'];
    const query = req.query as { [key: string]: string };
    const fileRefRequest = this.parseUid(uid, query);

    const fileRes = await this.filesOutput.getFileDbPathByFileRefRequest(
      fileRefRequest,
    );

    const ipfsCacheItemHeaders = this.getHeadersForFile(fileRes.fileMeta);
    res.status(fileRes.status).set(ipfsCacheItemHeaders);

    return new StreamableFile(
      fs.createReadStream(fileRes.fileMeta.absPathToFile),
    );
  }

  @Head(':uid/:args')
  @ApiOperation({
    summary: ':uid/:args',
    description: 'get data for file ref by uid',
  })
  async headBySha256AndArgs(
    @Param() params: ByUidAndArgsDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const uid = params['uid'];
    const args = params['args'];
    const query = req.query as { [key: string]: string };
    const localFilesRequest = this.getFileRefByUidAndArgsAndQuery(
      uid,
      args,
      query,
    );

    const fileRes = await this.filesOutput.getFileDbPathByFileRefRequest(
      localFilesRequest,
    );

    const fileItemHeaders = this.getHeadersForFile(fileRes.fileMeta);
    res.status(fileRes.status).set(fileItemHeaders);
    res.send('');
  }

  @Get(':uid/:args')
  @ApiOperation({
    summary: ':uid/:args',
    description: 'get data for file by uid',
  })
  async getBySha256AndArgs(
    @Param() params: ByUidAndArgsDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const uid = params['uid'];
    const args = params['args'];
    const query = req.query as { [key: string]: string };
    const localFilesRequest = this.getFileRefByUidAndArgsAndQuery(
      uid,
      args,
      query,
    );

    const fileRes = await this.filesOutput.getFileDbPathByFileRefRequest(
      localFilesRequest,
    );

    const ipfsCacheItemHeaders = this.getHeadersForFile(fileRes.fileMeta);
    res.status(fileRes.status).set(ipfsCacheItemHeaders);

    return new StreamableFile(
      fs.createReadStream(fileRes.fileMeta.absPathToFile),
    );
  }
}
