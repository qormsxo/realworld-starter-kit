import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleService } from '../article.service';
import { Article } from '../article.entity';
import { User } from '../../user/user.entity';
import { Profile } from '../../profile/profile.entity';
import { Tag } from '../../tag/tag.entity';
import { Follow } from '../../follow/follow.entity';
import { Favorite } from '../../favorite/favorite.entity';
import { TestModule } from '../../../../test/test.module';
import { ArticleCreateRequestBodyDto } from '../dto/req/article.create.dto';
import { NotFoundException } from '@nestjs/common';

jest.mock('typeorm-transactional', () => ({
    Transactional: () => () => ({}),
}));

describe('ArticleService', () => {
    let module: TestingModule;
    let articleRepository: Repository<Article>;
    let userRepository: Repository<User>;
    let tagRepository: Repository<Tag>;
    let profileRepository: Repository<Profile>;
    let service: ArticleService;

    let user: User;
    let article: Article;
    let tag1: Tag;
    let tag2: Tag;


    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                TestModule,
                TypeOrmModule.forFeature([Article, User, Tag, Profile, Follow, Favorite]),
            ],
            providers: [ArticleService],
        }).compile();

        service = module.get<ArticleService>(ArticleService);
        articleRepository = module.get(getRepositoryToken(Article));
        userRepository = module.get(getRepositoryToken(User));
        tagRepository = module.get(getRepositoryToken(Tag));
        profileRepository = module.get(getRepositoryToken(Profile));

        await articleRepository.delete({});
        await userRepository.delete({});
        await tagRepository.delete({});
        await profileRepository.delete({});

        // User 생성
        user = await userRepository.save(userRepository.create({ email: 'articleTest@example.com', password: 'password' }));
        // Profile 생성 (user와 연결)
        const profile = profileRepository.create({
            username: 'articleTestUser',
            bio: 'This is a test bio',
            image: 'test-image.jpg',
            user: user, // user와 관계 설정
        });

        await profileRepository.save(profile);
        
        // Tag 생성
        tag1 = await tagRepository.save(tagRepository.create({ name: 'nestjs' }));
        tag2 = await tagRepository.save(tagRepository.create({ name: 'typescript' }));

        // Article 생성
        article = await articleRepository.save(
            articleRepository.create({
                title: 'Test Article',
                slug: 'test-article',
                description: 'Test Description',
                body: 'Test Body',
                author: user,
                tags: [tag1, tag2],
            })
        );


    });

    afterEach(async () => {

    });

    afterAll(async () => {

        await module.close();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('새로운 기사를 생성해야 함', async () => {
        const articleDto: ArticleCreateRequestBodyDto = {
            title: 'New Article',
            description: 'New Description',
            body: 'New Body',
            tagList: ['testTag1', 'testTag2'],
        };

        const result = await service.createArticle(articleDto, user.id);

        // 생성된 기사의 제목과 설명을 확인
        expect(result.article).toHaveProperty('title', articleDto.title);
        expect(result.article).toHaveProperty('description', articleDto.description);
        expect(result.article.tagList[0]).toEqual('testTag1');  // 첫 번째 태그가 'testTag1'이어야 함
        expect(result.article.tagList[1]).toEqual('testTag2');  // 두 번째 태그가 'testTag2'이어야 함
    });

    it('슬러그로 기사를 조회해야 함', async () => {
        const result = await service.findBySlug('test-article');
        // 조회된 기사의 제목이 원래 기사의 제목과 같은지 확인
        expect(result).toHaveProperty('title', article.title);
    });

    it('기사가 없으면 NotFoundException을 던져야 함', async () => {
        // 존재하지 않는 슬러그로 조회할 경우 예외 발생 확인
        await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(NotFoundException);
    });

    it('기사를 좋아요 해야 함', async () => {
        const result = await service.favoriteArticle(user.id, article.slug);
        // 기사의 좋아요 수가 0보다 커야 함
        expect(result.favoritesCount).toBeGreaterThan(0);
    });

    it('기사를 좋아요 취소해야 함', async () => {
        await service.favoriteArticle(user.id, article.slug);  // 먼저 좋아요
        const result = await service.unFavoriteArticle(user.id, article.slug);
        // 기사의 좋아요 수가 0이어야 함
        expect(result.favoritesCount).toBe(0);
    });

});
